package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_knowledge_point")
public class ExamKnowledgePoint extends BaseEntity {
    private String name;
    private Long subjectId;
    private Long parentId;
    private List<ExamKnowledgePoint> children;
}