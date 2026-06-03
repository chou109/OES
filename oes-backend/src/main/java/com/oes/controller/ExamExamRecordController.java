package com.oes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.config.JwtUtils;
import com.oes.entity.*;
import com.oes.mapper.ExamWrongQuestionMapper;
import com.oes.service.*;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exam-records")
public class ExamExamRecordController {

    private final ExamExamRecordService examExamRecordService;
    private final ExamPaperService examPaperService;
    private final ExamExamService examExamService;
    private final ExamQuestionService examQuestionService;
    private final ExamWrongQuestionMapper examWrongQuestionMapper;
    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExamExamRecordController(ExamExamRecordService examExamRecordService,
                                    ExamPaperService examPaperService,
                                    ExamExamService examExamService,
                                    ExamQuestionService examQuestionService,
                                    ExamWrongQuestionMapper examWrongQuestionMapper,
                                    JwtUtils jwtUtils) {
        this.examExamRecordService = examExamRecordService;
        this.examPaperService = examPaperService;
        this.examExamService = examExamService;
        this.examQuestionService = examQuestionService;
        this.examWrongQuestionMapper = examWrongQuestionMapper;
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
            if (existRecord != null && "ONGOING".equals(existRecord.getStatus())) {
                // 允许继续考试
                Map<String, Object> result = new HashMap<>();
                result.put("recordId", existRecord.getId());
                result.put("record", existRecord);
                result.put("exam", exam);
                result.put("paper", examPaperService.getById(existRecord.getPaperId()));
                result.put("questions", examPaperService.getQuestions(examPaperService.getById(existRecord.getPaperId())));
                result.put("duration", exam.getDuration());
                result.put("totalScore", exam.getTotalScore());
                result.put("examConfig", exam.getAntiCheatConfig());
                return R.ok(result);
            } else if (existRecord != null && "SUBMITTED".equals(existRecord.getStatus())) {
                // 允许已提交的学生查看结果
                Map<String, Object> result = new HashMap<>();
                result.put("recordId", existRecord.getId());
                result.put("record", existRecord);
                result.put("exam", exam);
                result.put("paper", examPaperService.getById(existRecord.getPaperId()));
                result.put("questions", examPaperService.getQuestions(examPaperService.getById(existRecord.getPaperId())));
                result.put("duration", exam.getDuration());
                result.put("totalScore", exam.getTotalScore());
                result.put("examConfig", exam.getAntiCheatConfig());

                // 获取学生答案和评分信息
                List<ExamAnswer> answers = examExamRecordService.getAnswersByRecordId(existRecord.getId());
                Map<Long, Map<String, Object>> answerMap = new HashMap<>();
                boolean hasSubjectiveUngraded = false;

                for (ExamAnswer answer : answers) {
                    Map<String, Object> answerInfo = new HashMap<>();
                    answerInfo.put("answer", answer.getAnswer());
                    answerInfo.put("isCorrect", answer.getIsCorrect());
                    answerInfo.put("score", answer.getAutoScore());

                    ExamQuestion question = examQuestionService.getById(answer.getQuestionId());
                    if (question != null) {
                        answerInfo.put("correctAnswer", question.getAnswer());
                        // 判断是否为主观题且未评分
                        if (isSubjective(question.getType()) && (answer.getAutoScore() == null || answer.getAutoScore() == 0)) {
                            hasSubjectiveUngraded = true;
                        }
                    }
                    answerMap.put(answer.getQuestionId(), answerInfo);
                }
                result.put("answerMap", answerMap);
                result.put("hasSubjectiveUngraded", hasSubjectiveUngraded);

                // 判断是否允许查看试卷
                boolean allowView = exam.getEndTime().isBefore(java.time.LocalDateTime.now());
                if (!allowView && exam.getAntiCheatConfig() != null) {
                    try {
                        Map<String, Object> config = objectMapper.readValue(exam.getAntiCheatConfig(), Map.class);
                        if (config != null && config.containsKey("allowViewAfterExam")) {
                            allowView = Boolean.TRUE.equals(config.get("allowViewAfterExam"));
                        }
                    } catch (Exception e) {
                        allowView = false;
                    }
                }
                // 如果有主观题未评分，也不能查看详细答案
                if (hasSubjectiveUngraded) {
                    allowView = false;
                }
                result.put("canViewPaper", allowView);
                result.put("studentScore", existRecord.getScore());

                return R.ok(result);
            } else if (existRecord != null) {
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
        result.put("examConfig", exam.getAntiCheatConfig());

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

    @PostMapping("/submit/{recordId}")
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

    @PostMapping("/report-leave")
    public R<Void> reportLeave(@RequestBody Map<String, Object> params) {
        Long recordId = Long.valueOf(params.get("recordId").toString());
        Integer leaveCount = Integer.valueOf(params.get("leaveCount").toString());
        examExamRecordService.updateLeaveCount(recordId, leaveCount);
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
    public R<Map<String, Object>> getAnalysis(@RequestParam(required = false) Long examId, HttpServletRequest request) {
        if (examId != null) {
            return R.ok(examExamRecordService.getExamAnalysis(examId));
        }
        
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.replace("Bearer ", "");
            Long studentId = jwtUtils.getUserIdFromToken(token);
            return R.ok(examExamRecordService.getStudentAnalysis(studentId));
        }
        
        return R.error("无法获取用户信息");
    }

    @GetMapping("/student/stats")
    public R<Map<String, Object>> getStudentStats(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        Map<String, Object> stats = new HashMap<>();

        // 待考考试数量（未开始或进行中的考试）
        Long pendingCount = examExamRecordService.countByStudentAndStatus(studentId, "NOT_STARTED");
        Long ongoingCount = examExamRecordService.countByStudentAndStatus(studentId, "ONGOING");
        stats.put("pendingExams", pendingCount + ongoingCount);

        // 已完成考试数量
        Long completedCount = examExamRecordService.countByStudentAndStatus(studentId, "SUBMITTED");
        stats.put("completedExams", completedCount);

        // 错题数量
        Long wrongCount = examWrongQuestionMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.oes.entity.ExamWrongQuestion>()
                        .eq(com.oes.entity.ExamWrongQuestion::getStudentId, studentId));
        stats.put("wrongCount", wrongCount);

        // 平均分
        Double averageScore = examExamRecordService.getAverageScoreByStudent(studentId);
        stats.put("averageScore", averageScore != null ? Math.round(averageScore * 10) / 10.0 : 0);

        return R.ok(stats);
    }

    private boolean isSubjective(String type) {
        return "FILL_BLANK".equals(type) ||
               "ESSAY".equals(type) ||
               "PROGRAMMING".equals(type);
    }
}