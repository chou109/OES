package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.config.JwtUtils;
import com.oes.entity.*;
import com.oes.service.*;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exam-records")
public class ExamExamRecordController {

    private final ExamExamRecordService examExamRecordService;
    private final ExamPaperService examPaperService;
    private final ExamExamService examExamService;
    private final JwtUtils jwtUtils;

    public ExamExamRecordController(ExamExamRecordService examExamRecordService,
                                    ExamPaperService examPaperService,
                                    ExamExamService examExamService,
                                    JwtUtils jwtUtils) {
        this.examExamRecordService = examExamRecordService;
        this.examPaperService = examPaperService;
        this.examExamService = examExamService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/page")
    public R<PageResult<ExamExamRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String status) {
        return R.ok(examExamRecordService.page(current, size, examId, studentId, status));
    }

    @GetMapping("/{id}")
    public R<ExamExamRecord> getById(@PathVariable Long id) {
        return R.ok(examExamRecordService.getById(id));
    }

    @PostMapping("/start")
    public R<Map<String, Object>> startExam(@RequestBody Map<String, Long> params, HttpServletRequest request) {
        Long examId = params.get("examId");
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        ExamExam exam = examExamService.getById(examId);
        if (exam == null) {
            return R.error("考试不存在");
        }

        ExamExamRecord existRecord = examExamRecordService.getByExamAndStudent(examId, studentId);
        if (existRecord != null && !"NOT_STARTED".equals(existRecord.getStatus())) {
            return R.error("您已参加过此考试");
        }

        ExamPaper paper = examPaperService.getById(exam.getPaperId());
        if (paper == null) {
            return R.error("试卷不存在");
        }

        List<Long> questionIds = examPaperService.getQuestionIds(paper);
        Collections.shuffle(questionIds);

        Map<String, Object> result = new HashMap<>();
        result.put("recordId", existRecord != null ? existRecord.getId() :
                examExamRecordService.startExam(examId, studentId, exam.getPaperId(),
                        String.join(",", questionIds.stream().map(String::valueOf).collect(Collectors.toList())),
                        "").getId());
        result.put("questions", examPaperService.getQuestions(paper));
        result.put("duration", exam.getDuration());
        result.put("totalScore", exam.getTotalScore());

        return R.ok(result);
    }

    @PostMapping("/answer")
    public R<Void> saveAnswer(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        Long recordId = Long.valueOf(params.get("recordId").toString());
        Long questionId = Long.valueOf(params.get("questionId").toString());
        String answer = params.get("answer").toString();

        examExamRecordService.saveAnswer(recordId, studentId, questionId, answer);
        return R.ok();
    }

    @PostMapping("/auto-save")
    public R<Void> autoSave(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        Long recordId = Long.valueOf(params.get("recordId").toString());
        Map<String, String> answers = (Map<String, String>) params.get("answers");

        if (answers != null) {
            for (Map.Entry<String, String> entry : answers.entrySet()) {
                Long questionId = Long.valueOf(entry.getKey());
                String answer = entry.getValue();
                examExamRecordService.saveAnswer(recordId, studentId, questionId, answer);
            }
        }
        return R.ok();
    }

    @PostMapping("/submit")
    public R<Void> submit(@PathVariable Long recordId) {
        examExamRecordService.submitExam(recordId);
        return R.ok();
    }

    @PostMapping("/screen-switch")
    public R<Void> recordScreenSwitch(@RequestBody Map<String, Long> params) {
        Long recordId = params.get("recordId");
        examExamRecordService.incrementScreenSwitch(recordId);

        ExamExamRecord record = examExamRecordService.getById(recordId);
        if (record != null && record.getScreenSwitchCount() >= 3) {
            examExamRecordService.submitExam(recordId);
            return R.error("切屏次数过多，已自动交卷");
        }
        return R.ok();
    }

    @GetMapping("/{id}/answers")
    public R<List<ExamAnswer>> getAnswers(@PathVariable Long id) {
        return R.ok(examExamRecordService.getAnswersByRecordId(id));
    }

    @GetMapping("/student/history")
    public R<PageResult<Map<String, Object>>> getStudentHistory(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        PageResult<ExamExamRecord> pageResult = examExamRecordService.page(current, size, null, studentId, "SUBMITTED");

        List<Map<String, Object>> records = pageResult.getRecords().stream().map(record -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("examId", record.getExamId());
            map.put("score", record.getScore());
            map.put("submitTime", record.getSubmitTime());
            map.put("status", record.getStatus());

            ExamExam exam = examExamService.getById(record.getExamId());
            if (exam != null) {
                map.put("examTitle", exam.getTitle());
                map.put("subjectId", exam.getSubjectId());
                map.put("duration", exam.getDuration());
            }
            return map;
        }).collect(Collectors.toList());

        return R.ok(new PageResult<>(pageResult.getTotal(), records, (long) current, (long) size));
    }

    @GetMapping("/analysis")
    public R<Map<String, Object>> getAnalysis(@RequestParam Long examId) {
        return R.ok(examExamRecordService.getExamAnalysis(examId));
    }
}