package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamStatistics;
import com.oes.config.JwtUtils;
import com.oes.service.ExamExamService;
import com.oes.service.SysLogService;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
public class ExamExamController {

    private final ExamExamService examExamService;
    private final SysLogService sysLogService;
    private final JwtUtils jwtUtils;

    public ExamExamController(ExamExamService examExamService, SysLogService sysLogService, JwtUtils jwtUtils) {
        this.examExamService = examExamService;
        this.sysLogService = sysLogService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/page")
    public R<PageResult<ExamExam>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return R.ok(examExamService.page(current, size, subjectId, status, keyword));
    }

    @GetMapping("/student/page")
    public R<PageResult<Map<String, Object>>> studentPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            HttpServletRequest request) {
        System.out.println("========== 学生考试列表接口被调用 ==========");
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);
        System.out.println("学生ID: " + studentId);
        return R.ok(examExamService.studentPageWithStatus(current, size, studentId, keyword, status));
    }

    @GetMapping("/{id}")
    public R<ExamExam> getById(@PathVariable Long id) {
        return R.ok(examExamService.getById(id));
    }

    @PostMapping
    public R<Long> create(@RequestBody ExamExam exam, HttpServletRequest request) {
        examExamService.createExam(exam);
        try {
            String username = getUsername(request);
            sysLogService.saveLog(username, "创建考试", "POST /api/exams", 
                    "{\"title\":\"" + exam.getTitle() + "\"}", 
                    request.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return R.ok(exam.getId());
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamExam exam, HttpServletRequest request) {
        examExamService.updateExam(exam);
        try {
            String username = getUsername(request);
            sysLogService.saveLog(username, "修改考试", "PUT /api/exams", 
                    "{\"id\":\"" + exam.getId() + "\",\"title\":\"" + exam.getTitle() + "\"}", 
                    request.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return R.ok();
    }

    @PutMapping("/{id}/publish")
    public R<Void> publish(@PathVariable Long id, HttpServletRequest request) {
        System.out.println("========== 发布考试接口被调用 ==========");
        System.out.println("考试ID: " + id);
        try {
            examExamService.publishExam(id);
            ExamExam exam = examExamService.getById(id);
            String title = exam != null ? exam.getTitle() : "未知考试";
            String username = getUsername(request);
            sysLogService.saveLog(username, "发布考试", "PUT /api/exams/" + id + "/publish", 
                    "{\"id\":\"" + id + "\",\"title\":\"" + title + "\"}", 
                    request.getRemoteAddr());
            System.out.println("========== 发布考试成功 ==========");
            return R.ok();
        } catch (Exception e) {
            System.out.println("========== 发布考试失败: " + e.getMessage() + " ==========");
            e.printStackTrace();
            return R.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/start")
    public R<Void> start(@PathVariable Long id, HttpServletRequest request) {
        examExamService.startExam(id);
        try {
            ExamExam exam = examExamService.getById(id);
            String title = exam != null ? exam.getTitle() : "未知考试";
            String username = getUsername(request);
            sysLogService.saveLog(username, "开始考试", "PUT /api/exams/" + id + "/start", 
                    "{\"id\":\"" + id + "\",\"title\":\"" + title + "\"}", 
                    request.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return R.ok();
    }

    @PutMapping("/{id}/extend")
    public R<Void> extend(@PathVariable Long id, @RequestParam Integer minutes) {
        examExamService.extendExam(id, minutes);
        return R.ok();
    }

    @PutMapping("/{id}/finish")
    public R<Void> finish(@PathVariable Long id, HttpServletRequest request) {
        examExamService.finishExam(id);
        try {
            ExamExam exam = examExamService.getById(id);
            String title = exam != null ? exam.getTitle() : "未知考试";
            String username = getUsername(request);
            sysLogService.saveLog(username, "结束考试", "PUT /api/exams/" + id + "/finish", 
                    "{\"id\":\"" + id + "\",\"title\":\"" + title + "\"}", 
                    request.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        ExamExam exam = examExamService.getById(id);
        String title = exam != null ? exam.getTitle() : "未知考试";
        examExamService.removeById(id);
        try {
            String username = getUsername(request);
            sysLogService.saveLog(username, "删除考试", "DELETE /api/exams/" + id, 
                    "{\"id\":\"" + id + "\",\"title\":\"" + title + "\"}", 
                    request.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return R.ok();
    }

    private String getUsername(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            try {
                String payload = token.split("\\.")[1];
                byte[] decoded = java.util.Base64.getUrlDecoder().decode(payload);
                String json = new String(decoded);
                int start = json.indexOf("\"username\":\"") + 12;
                int end = json.indexOf("\"", start);
                return json.substring(start, end);
            } catch (Exception e) {
                return "anonymous";
            }
        }
        return "anonymous";
    }

    @GetMapping("/{id}/statistics")
    public R<?> getStatistics(@PathVariable Long id) {
        try {
            ExamStatistics stats = examExamService.getStatistics(id);
            if (stats == null) {
                stats = new ExamStatistics();
                stats.setExamId(id);
                stats.setTotalStudents(0);
                stats.setSubmittedCount(0);
                stats.setAvgScore(java.math.BigDecimal.ZERO);
                stats.setMaxScore(0);
                stats.setMinScore(0);
                stats.setPassRate(java.math.BigDecimal.ZERO);
                stats.setSuspiciousCount(0);
            }
            return R.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return R.error("获取统计信息失败: " + e.getMessage());
        }
    }
}
