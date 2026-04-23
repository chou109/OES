package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_statistics")
public class ExamStatistics extends BaseEntity {
    private Long examId;
    private Integer totalStudents;
    private Integer submittedCount;
    private BigDecimal avgScore;
    private Integer maxScore;
    private Integer minScore;
    private BigDecimal passRate;
    private Integer suspiciousCount;
}
