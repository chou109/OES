package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.entity.ExamKnowledgePoint;
import com.oes.mapper.ExamKnowledgePointMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamKnowledgePointService extends ServiceImpl<ExamKnowledgePointMapper, ExamKnowledgePoint> {

    public List<ExamKnowledgePoint> listBySubjectId(Long subjectId) {
        return list(new LambdaQueryWrapper<ExamKnowledgePoint>()
                .eq(subjectId != null, ExamKnowledgePoint::getSubjectId, subjectId)
                .orderByAsc(ExamKnowledgePoint::getName));
    }

    public List<ExamKnowledgePoint> getTreeBySubjectId(Long subjectId) {
        List<ExamKnowledgePoint> all = listBySubjectId(subjectId);
        return buildTree(all);
    }

    private List<ExamKnowledgePoint> buildTree(List<ExamKnowledgePoint> list) {
        return list.stream()
                .filter(kp -> kp.getParentId() == null)
                .peek(kp -> kp.setChildren(getChildren(kp.getId(), list)))
                .toList();
    }

    private List<ExamKnowledgePoint> getChildren(Long parentId, List<ExamKnowledgePoint> list) {
        return list.stream()
                .filter(kp -> parentId.equals(kp.getParentId()))
                .toList();
    }
}
