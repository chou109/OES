package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamStatistics;
import com.oes.service.ExamExamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
public class ExamExamController {

    private final ExamExamService examExamService;

    public ExamExamController(ExamExamService examExamService) {
        this.examExamService = examExamService;
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
    public R<PageResult<ExamExam>> studentPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String status) {
        return R.ok(examExamService.studentPage(current, size, studentId, status));
    }

    @GetMapping("/{id}")
    public R<ExamExam> getById(@PathVariable Long id) {
        return R.ok(examExamService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamExam exam) {
        examExamService.createExam(exam);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamExam exam) {
        examExamService.updateExam(exam);
        return R.ok();
    }

    @PutMapping("/{id}/publish")
    public R<Void> publish(@PathVariable Long id) {
        try {
            examExamService.publishExam(id);
            return R.ok();
        } catch (Exception e) {
            return R.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/start")
    public R<Void> start(@PathVariable Long id) {
        examExamService.startExam(id);
        return R.ok();
    }

    @PutMapping("/{id}/finish")
    public R<Void> finish(@PathVariable Long id) {
        examExamService.finishExam(id);
        return R.ok();
    }

    @PutMapping("/{id}/extend")
    public R<Void> extend(@PathVariable Long id, @RequestParam Integer minutes) {
        examExamService.extendTime(id, minutes);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examExamService.removeById(id);
        return R.ok();
    }

    @GetMapping("/{id}/statistics")
    public R<ExamStatistics> getStatistics(@PathVariable Long id) {
        return R.ok(examExamService.getStatistics(id));
    }
}
