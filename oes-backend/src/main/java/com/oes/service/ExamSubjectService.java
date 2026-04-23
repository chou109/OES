package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamSubject;
import com.oes.mapper.ExamSubjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ExamSubjectService extends ServiceImpl<ExamSubjectMapper, ExamSubject> {

    public PageResult<ExamSubject> page(Integer current, Integer size, String keyword) {
        Page<ExamSubject> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamSubject> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(ExamSubject::getName, keyword)
                    .or().like(ExamSubject::getCode, keyword));
        }
        wrapper.orderByDesc(ExamSubject::getCreateTime);
        IPage<ExamSubject> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public List<ExamSubject> listAll() {
        return list(new LambdaQueryWrapper<ExamSubject>()
                .orderByAsc(ExamSubject::getName));
    }

    public List<ExamSubject> listByDepartmentId(Long departmentId) {
        return list(new LambdaQueryWrapper<ExamSubject>()
                .eq(departmentId != null, ExamSubject::getDepartmentId, departmentId)
                .orderByAsc(ExamSubject::getName));
    }
}