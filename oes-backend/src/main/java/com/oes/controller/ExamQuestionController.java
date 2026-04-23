package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamQuestion;
import com.oes.service.ExamQuestionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class ExamQuestionController {

    private final ExamQuestionService examQuestionService;

    public ExamQuestionController(ExamQuestionService examQuestionService) {
        this.examQuestionService = examQuestionService;
    }

    @GetMapping("/page")
    public R<PageResult<ExamQuestion>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String keyword) {
        return R.ok(examQuestionService.page(current, size, subjectId, type, difficulty, keyword));
    }

    @GetMapping("/{id}")
    public R<ExamQuestion> getById(@PathVariable Long id) {
        return R.ok(examQuestionService.getById(id));
    }

    @GetMapping("/list")
    public R<List<ExamQuestion>> list(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Integer count,
            @RequestParam(required = false) String knowledgePointIds) {
        return R.ok(examQuestionService.randomQuestions(subjectId, type, difficulty, count, knowledgePointIds));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamQuestion question) {
        examQuestionService.save(question);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamQuestion question) {
        examQuestionService.updateById(question);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examQuestionService.removeById(id);
        return R.ok();
    }

    @GetMapping("/{id}/correct-rate")
    public R<Double> getCorrectRate(@PathVariable Long id) {
        return R.ok(examQuestionService.getCorrectRate(id));
    }
}
