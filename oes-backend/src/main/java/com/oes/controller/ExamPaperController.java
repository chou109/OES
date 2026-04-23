package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamPaper;
import com.oes.entity.ExamQuestion;
import com.oes.service.ExamPaperService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/papers")
public class ExamPaperController {

    private final ExamPaperService examPaperService;

    public ExamPaperController(ExamPaperService examPaperService) {
        this.examPaperService = examPaperService;
    }

    @GetMapping("/page")
    public R<PageResult<ExamPaper>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return R.ok(examPaperService.page(current, size, subjectId, status, keyword));
    }

    @GetMapping("/{id}")
    public R<ExamPaper> getById(@PathVariable Long id) {
        return R.ok(examPaperService.getById(id));
    }

    @GetMapping("/{id}/questions")
    public R<List<ExamQuestion>> getQuestions(@PathVariable Long id) {
        ExamPaper paper = examPaperService.getById(id);
        if (paper == null) {
            return R.notFound();
        }
        return R.ok(examPaperService.getQuestions(paper));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamPaper paper,
                           @RequestParam(required = false) List<Long> questionIds) {
        examPaperService.createPaper(paper, questionIds);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamPaper paper,
                          @RequestParam(required = false) List<Long> questionIds) {
        examPaperService.updatePaper(paper, questionIds);
        return R.ok();
    }

    @PutMapping("/{id}/publish")
    public R<Void> publish(@PathVariable Long id) {
        try {
            examPaperService.publishPaper(id);
            return R.ok();
        } catch (Exception e) {
            return R.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examPaperService.removeById(id);
        return R.ok();
    }
}
