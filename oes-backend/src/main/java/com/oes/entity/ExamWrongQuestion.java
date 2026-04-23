package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_wrong_question")
public class ExamWrongQuestion extends BaseEntity {
    private Long studentId;
    private Long questionId;
    private Long examId;
    private String wrongAnswer;
    private String correctAnswer;
    private Integer practicedCount;
    private java.time.LocalDateTime lastPracticeTime;
}
