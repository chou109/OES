package com.oes.controller;

import com.oes.common.base.R;
import com.oes.entity.SysDepartment;
import com.oes.service.SysDepartmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class SysDepartmentController {

    private final SysDepartmentService sysDepartmentService;

    public SysDepartmentController(SysDepartmentService sysDepartmentService) {
        this.sysDepartmentService = sysDepartmentService;
    }

    @GetMapping("/tree")
    public R<List<SysDepartment>> getTree() {
        return R.ok(sysDepartmentService.getTreeList());
    }

    @GetMapping
    public R<List<SysDepartment>> list() {
        return R.ok(sysDepartmentService.list());
    }

    @GetMapping("/{id}")
    public R<SysDepartment> getById(@PathVariable Long id) {
        return R.ok(sysDepartmentService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody SysDepartment department) {
        sysDepartmentService.save(department);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody SysDepartment department) {
        sysDepartmentService.updateById(department);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysDepartmentService.removeById(id);
        return R.ok();
    }
}
