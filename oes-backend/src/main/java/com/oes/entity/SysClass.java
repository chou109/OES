package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_class")
public class SysClass extends BaseEntity {
    private String name;
    private String code;
    private Long departmentId;
    private String grade;
}
