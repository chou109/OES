package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.SysUser;
import com.oes.service.SysUserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class SysUserController {

    private final SysUserService sysUserService;

    public SysUserController(SysUserService sysUserService) {
        this.sysUserService = sysUserService;
    }

    @GetMapping("/page")
    public R<PageResult<SysUser>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role) {
        return R.ok(sysUserService.page(current, size, keyword, role));
    }

    @GetMapping("/{id}")
    public R<SysUser> getById(@PathVariable Long id) {
        return R.ok(sysUserService.getById(id));
    }

    @PostMapping
    public R<Void> create(@RequestBody SysUser user) {
        sysUserService.register(user);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody SysUser user) {
        sysUserService.updateUser(user);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysUserService.removeById(id);
        return R.ok();
    }

    @GetMapping("/students")
    public R<List<SysUser>> getStudents() {
        List<SysUser> students = sysUserService.list(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getRole, "STUDENT")
                        .eq(SysUser::getStatus, 1)
                        .orderByAsc(SysUser::getRealName)
        );
        return R.ok(students);
    }

    @GetMapping("/teachers")
    public R<List<SysUser>> getTeachers() {
        List<SysUser> teachers = sysUserService.list(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getRole, "TEACHER")
                        .eq(SysUser::getStatus, 1)
                        .orderByAsc(SysUser::getRealName)
        );
        return R.ok(teachers);
    }

    @PutMapping("/{id}/status")
    public R<Void> changeStatus(@PathVariable Long id, @RequestParam Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        sysUserService.updateUser(user);
        return R.ok();
    }
}
