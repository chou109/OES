package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.SysLog;
import com.oes.mapper.SysLogMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SysLogService extends ServiceImpl<SysLogMapper, SysLog> {

    public PageResult<SysLog> page(Integer current, Integer size, String username, String operation) {
        Page<SysLog> page = new Page<>(current, size);
        LambdaQueryWrapper<SysLog> wrapper = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            wrapper.like(SysLog::getUsername, username);
        }
        if (operation != null && !operation.isEmpty()) {
            wrapper.like(SysLog::getOperation, operation);
        }
        wrapper.orderByDesc(SysLog::getCreateTime);
        IPage<SysLog> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public void saveLog(String username, String operation, String method, String params, String ip) {
        SysLog log = new SysLog();
        log.setUsername(username);
        log.setOperation(operation);
        log.setMethod(method);
        log.setParams(params);
        log.setIp(ip);
        save(log);
    }

    public List<SysLog> getRecentLogs(int limit) {
        Page<SysLog> page = new Page<>(1, limit);
        return page(page, new LambdaQueryWrapper<SysLog>()
                .orderByDesc(SysLog::getCreateTime))
                .getRecords();
    }
}