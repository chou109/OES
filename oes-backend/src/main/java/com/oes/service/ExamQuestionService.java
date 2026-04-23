package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamQuestion;
import com.oes.mapper.ExamQuestionMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamQuestionService extends ServiceImpl<ExamQuestionMapper, ExamQuestion> {

    public PageResult<ExamQuestion> page(Integer current, Integer size, Long subjectId, String type,
                                         String difficulty, String keyword) {
        Page<ExamQuestion> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamQuestion> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamQuestion::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(ExamQuestion::getType, type);
        }
        if (StringUtils.hasText(difficulty)) {
            wrapper.eq(ExamQuestion::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ExamQuestion::getContent, keyword);
        }
        wrapper.orderByDesc(ExamQuestion::getCreateTime);
        IPage<ExamQuestion> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public List<ExamQuestion> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return list(new LambdaQueryWrapper<ExamQuestion>()
                .in(ExamQuestion::getId, ids));
    }

    public List<ExamQuestion> randomQuestions(Long subjectId, String type, String difficulty,
                                               Integer count, String knowledgePointIds) {
        LambdaQueryWrapper<ExamQuestion> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamQuestion::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(ExamQuestion::getType, type);
        }
        if (StringUtils.hasText(difficulty)) {
            wrapper.eq(ExamQuestion::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(knowledgePointIds)) {
            wrapper.apply("FIND_IN_SET(knowledge_point_ids, {0})",
                    Arrays.stream(knowledgePointIds.split(","))
                            .map(String::trim)
                            .collect(Collectors.joining(",")));
        }
        // 使用 apply 方法实现随机排序
        wrapper.apply("ORDER BY RAND()");
        return page(new Page<>(1, count), wrapper).getRecords();
    }

    public void incrementUsedCount(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question != null) {
            question.setUsedCount(question.getUsedCount() + 1);
            updateById(question);
        }
    }

    public void incrementCorrectCount(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question != null) {
            question.setCorrectCount(question.getCorrectCount() + 1);
            updateById(question);
        }
    }

    public Double getCorrectRate(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question == null || question.getUsedCount() == 0) {
            return 0.0;
        }
        return (double) question.getCorrectCount() / question.getUsedCount();
    }
}