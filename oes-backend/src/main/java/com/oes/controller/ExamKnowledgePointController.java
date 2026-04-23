package com.oes.controller;

import com.oes.common.base.R;
import com.oes.entity.ExamKnowledgePoint;
import com.oes.service.ExamKnowledgePointService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge-points")
public class ExamKnowledgePointController {

    private final ExamKnowledgePointService examKnowledgePointService;

    public ExamKnowledgePointController(ExamKnowledgePointService examKnowledgePointService) {
        this.examKnowledgePointService = examKnowledgePointService;
    }

    @GetMapping
    public R<List<ExamKnowledgePoint>> list(@RequestParam(required = false) Long subjectId) {
        return R.ok(examKnowledgePointService.listBySubjectId(subjectId));
    }

    @GetMapping("/tree")
    public R<List<ExamKnowledgePoint>> tree(@RequestParam(required = false) Long subjectId) {
        return R.ok(examKnowledgePointService.getTreeBySubjectId(subjectId));
    }

    @GetMapping("/{id}")
    public R<ExamKnowledgePoint> getById(@PathVariable Long id) {
        return R.ok(examKnowledgePointService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamKnowledgePoint knowledgePoint) {
        examKnowledgePointService.save(knowledgePoint);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamKnowledgePoint knowledgePoint) {
        examKnowledgePointService.updateById(knowledgePoint);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examKnowledgePointService.removeById(id);
        return R.ok();
    }
}
