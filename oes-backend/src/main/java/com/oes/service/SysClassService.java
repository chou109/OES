package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.SysClass;
import com.oes.mapper.SysClassMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class SysClassService extends ServiceImpl<SysClassMapper, SysClass> {

    public PageResult<SysClass> page(Integer current, Integer size, String keyword, Long departmentId) {
        Page<SysClass> page = new Page<>(current, size);
        LambdaQueryWrapper<SysClass> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(SysClass::getName, keyword)
                    .or().like(SysClass::getCode, keyword));
        }
        if (departmentId != null) {
            wrapper.eq(SysClass::getDepartmentId, departmentId);
        }
        wrapper.orderByDesc(SysClass::getCreateTime);
        IPage<SysClass> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public List<SysClass> listByDepartmentId(Long departmentId) {
        return list(new LambdaQueryWrapper<SysClass>()
                .eq(departmentId != null, SysClass::getDepartmentId, departmentId)
                .orderByAsc(SysClass::getGrade, SysClass::getName));
    }

    public List<SysClass> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return listByIds(ids);
    }
}