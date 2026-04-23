package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamSubject;
import com.oes.service.ExamSubjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class ExamSubjectController {

    private final ExamSubjectService examSubjectService;

    public ExamSubjectController(ExamSubjectService examSubjectService) {
        this.examSubjectService = examSubjectService;
    }

    @GetMapping("/page")
    public R<PageResult<ExamSubject>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword) {
        return R.ok(examSubjectService.page(current, size, keyword));
    }

    @GetMapping
    public R<List<ExamSubject>> list() {
        return R.ok(examSubjectService.listAll());
    }

    @GetMapping("/{id}")
    public R<ExamSubject> getById(@PathVariable Long id) {
        return R.ok(examSubjectService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamSubject subject) {
        examSubjectService.save(subject);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamSubject subject) {
        examSubjectService.updateById(subject);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examSubjectService.removeById(id);
        return R.ok();
    }
}
