package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.SysLog;
import com.oes.service.SysLogService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
public class SysLogController {

    private final SysLogService sysLogService;

    public SysLogController(SysLogService sysLogService) {
        this.sysLogService = sysLogService;
    }

    @GetMapping("/page")
    public R<PageResult<SysLog>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String operation) {
        return R.ok(sysLogService.page(current, size, username, operation));
    }
}
