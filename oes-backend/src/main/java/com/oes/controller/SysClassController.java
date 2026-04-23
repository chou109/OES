package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.SysClass;
import com.oes.service.SysClassService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class SysClassController {

    private final SysClassService sysClassService;

    public SysClassController(SysClassService sysClassService) {
        this.sysClassService = sysClassService;
    }

    @GetMapping("/page")
    public R<PageResult<SysClass>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId) {
        return R.ok(sysClassService.page(current, size, keyword, departmentId));
    }

    @GetMapping
    public R<List<SysClass>> list(@RequestParam(required = false) Long departmentId) {
        return R.ok(sysClassService.listByDepartmentId(departmentId));
    }

    @GetMapping("/{id}")
    public R<SysClass> getById(@PathVariable Long id) {
        return R.ok(sysClassService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody SysClass sysClass) {
        sysClassService.save(sysClass);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody SysClass sysClass) {
        sysClassService.updateById(sysClass);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysClassService.removeById(id);
        return R.ok();
    }
}
