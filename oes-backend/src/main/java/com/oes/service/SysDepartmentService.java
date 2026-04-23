package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.entity.SysDepartment;
import com.oes.mapper.SysDepartmentMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SysDepartmentService extends ServiceImpl<SysDepartmentMapper, SysDepartment> {

    public List<SysDepartment> getTreeList() {
        List<SysDepartment> all = list();
        return buildTree(all);
    }

    private List<SysDepartment> buildTree(List<SysDepartment> list) {
        return list.stream()
                .filter(dept -> dept.getParentId() == null)
                .peek(dept -> dept.setChildren(getChildren(dept.getId(), list)))
                .toList();
    }

    private List<SysDepartment> getChildren(Long parentId, List<SysDepartment> list) {
        return list.stream()
                .filter(dept -> parentId.equals(dept.getParentId()))
                .peek(dept -> dept.setChildren(getChildren(dept.getId(), list)))
                .toList();
    }

    public List<SysDepartment> listByParentId(Long parentId) {
        return list(new LambdaQueryWrapper<SysDepartment>()
                .eq(parentId != null, SysDepartment::getParentId, parentId)
                .orderByAsc(SysDepartment::getSortOrder));
    }
}
