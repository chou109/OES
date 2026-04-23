package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_department")
public class SysDepartment extends BaseEntity {
    private String name;
    private String code;
    private Long parentId;
    private Integer sortOrder;
    private List<SysDepartment> children;
}