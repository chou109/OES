package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.SysClass;
import com.oes.entity.SysClassMember;
import com.oes.entity.SysClassMessage;
import com.oes.entity.SysUser;
import com.oes.service.SysClassMemberService;
import com.oes.service.SysClassMessageService;
import com.oes.service.SysClassService;
import com.oes.service.SysUserService;
import com.oes.service.SysLogService;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/class")
public class ClassController {

    private final SysClassService sysClassService;
    private final SysClassMemberService classMemberService;
    private final SysClassMessageService classMessageService;
    private final SysUserService sysUserService;
    private final SysLogService sysLogService;

    public ClassController(SysClassService sysClassService, 
                          SysClassMemberService classMemberService,
                          SysClassMessageService classMessageService,
                          SysUserService sysUserService,
                          SysLogService sysLogService) {
        this.sysClassService = sysClassService;
        this.classMemberService = classMemberService;
        this.classMessageService = classMessageService;
        this.sysUserService = sysUserService;
        this.sysLogService = sysLogService;
    }

    @GetMapping("/my-classes")
    public R<List<Map<String, Object>>> getMyClasses(@RequestParam String userId) {
        Long uid = Long.parseLong(userId);
        List<SysClassMember> members = classMemberService.getMemberByUserId(uid);
        List<Map<String, Object>> result = members.stream().map(member -> {
            Map<String, Object> map = new HashMap<>();
            SysClass cls = sysClassService.getById(member.getClassId());
            if (cls != null) {
                map.put("class", cls);
                map.put("role", member.getRole());
                map.put("muteUntil", member.getMuteUntil());
            }
            return map;
        }).filter(map -> !map.isEmpty()).toList();
        return R.ok(result);
    }

    @GetMapping("/{classId}/members")
    public R<List<Map<String, Object>>> getClassMembers(@PathVariable Long classId) {
        List<SysClassMember> members = classMemberService.getMembersByClassId(classId);
        List<Map<String, Object>> result = members.stream().map(member -> {
            Map<String, Object> map = new HashMap<>();
            SysUser user = sysUserService.getById(member.getUserId());
            map.put("userId", member.getUserId());
            map.put("username", user.getUsername());
            map.put("realName", user.getRealName());
            map.put("role", member.getRole());
            map.put("muteUntil", member.getMuteUntil());
            map.put("joinedAt", member.getJoinedAt());
            map.put("departmentId", user.getDepartmentId());
            return map;
        }).toList();
        return R.ok(result);
    }

    @PostMapping("/join")
    public R<Void> joinClass(@RequestBody Map<String, Long> request) {
        Long classId = request.get("classId");
        Long userId = request.get("userId");
        
        if (classMemberService.isMember(classId, userId)) {
            return R.error("已加入该班级");
        }
        
        classMemberService.addMember(classId, userId, "MEMBER");
        return R.ok();
    }

    @PostMapping("/join-by-code")
    public R<Map<String, Object>> joinClassByInviteCode(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        String inviteCode = (String) request.get("inviteCode");
        Long userId = ((Number) request.get("userId")).longValue();
        
        SysClass sysClass = sysClassService.getByInviteCode(inviteCode);
        if (sysClass == null) {
            return R.error("班级不存在");
        }
        
        if (classMemberService.isMember(sysClass.getId(), userId)) {
            return R.error("已加入该班级");
        }
        
        classMemberService.addMember(sysClass.getId(), userId, "MEMBER");
        
        try {
            String username = getUsername(httpRequest);
            sysLogService.saveLog(username, "加入班级", "POST /api/class/join-by-code", 
                    "{\"inviteCode\":\"" + inviteCode + "\",\"className\":\"" + sysClass.getName() + "\"}", 
                    httpRequest.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("classId", sysClass.getId());
        result.put("className", sysClass.getName());
        result.put("inviteCode", sysClass.getInviteCode());
        return R.ok(result);
    }

    @PostMapping("/create")
    public R<SysClass> createClass(@RequestBody Map<String, Object> request, @RequestParam Long teacherId, HttpServletRequest httpRequest) {
        String className = (String) request.get("className");
        SysClass sysClass = new SysClass();
        sysClass.setName(className);
        sysClass.setCode((String) request.get("code"));
        Object deptId = request.get("departmentId");
        if (deptId != null) {
            sysClass.setDepartmentId(((Number) deptId).longValue());
        }
        sysClass.setGrade((String) request.get("grade"));
        sysClass.setInviteCode(generateInviteCode());
        
        sysClassService.save(sysClass);
        
        classMemberService.addMember(sysClass.getId(), teacherId, "OWNER");
        
        try {
            String username = getUsername(httpRequest);
            sysLogService.saveLog(username, "创建班级", "POST /api/class/create", 
                    "{\"className\":\"" + className + "\"}", 
                    httpRequest.getRemoteAddr());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return R.ok(sysClass);
    }

    private String generateInviteCode() {
        int length = 5 + (int)(Math.random() * 4);
        int code = (int)(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)));
        return String.valueOf(code);
    }

    @DeleteMapping("/{classId}/member/{userId}")
    public R<Void> removeMember(@PathVariable Long classId, @PathVariable Long userId, @RequestParam Long operatorId) {
        if (!classMemberService.isAdmin(classId, operatorId)) {
            return R.error("无权限操作");
        }
        
        if (classMemberService.isOwner(classId, userId)) {
            return R.error("不能移除班级所有者");
        }
        
        classMemberService.removeMember(classId, userId);
        return R.ok();
    }

    @PutMapping("/{classId}/member/{userId}/role")
    public R<Void> updateMemberRole(@PathVariable Long classId, @PathVariable Long userId, 
                                    @RequestBody Map<String, String> request, @RequestParam Long operatorId) {
        if (!classMemberService.isOwner(classId, operatorId)) {
            return R.error("只有班级所有者可以修改角色");
        }
        
        String role = request.get("role");
        if (!"ADMIN".equals(role) && !"MEMBER".equals(role)) {
            return R.error("无效的角色");
        }
        
        classMemberService.updateRole(classId, userId, role);
        return R.ok();
    }

    @PutMapping("/{classId}/member/{userId}/mute")
    public R<Void> muteMember(@PathVariable Long classId, @PathVariable Long userId, 
                              @RequestBody Map<String, Integer> request, @RequestParam Long operatorId) {
        if (!classMemberService.isAdmin(classId, operatorId)) {
            return R.error("无权限操作");
        }
        
        Integer minutes = request.get("minutes");
        classMemberService.muteMember(classId, userId, minutes);
        return R.ok();
    }

    @PutMapping("/{classId}/mute-all")
    public R<Void> muteAllMembers(@PathVariable Long classId, 
                                  @RequestBody Map<String, Integer> request, @RequestParam Long operatorId) {
        if (!classMemberService.isOwner(classId, operatorId)) {
            return R.error("只有班级所有者可以全体禁言");
        }
        
        Integer minutes = request.get("minutes");
        classMemberService.muteAllMembers(classId, minutes);
        return R.ok();
    }

    @GetMapping("/{classId}/messages")
    public R<PageResult<SysClassMessage>> getMessages(@PathVariable Long classId,
                                                      @RequestParam(defaultValue = "1") Integer current,
                                                      @RequestParam(defaultValue = "20") Integer size) {
        return R.ok(classMessageService.getMessagesByClassId(classId, current, size));
    }

    @PostMapping("/{classId}/message")
    public R<SysClassMessage> sendMessage(@PathVariable Long classId, 
                                          @RequestBody Map<String, Object> request,
                                          @RequestParam Long senderId) {
        if (!classMemberService.isMember(classId, senderId)) {
            return R.error("不是班级成员");
        }
        
        if (classMemberService.isMuted(classId, senderId)) {
            return R.error("当前处于禁言状态");
        }
        
        String content = (String) request.get("content");
        String type = (String) request.get("type");
        String fileUrl = (String) request.get("fileUrl");
        
        SysClassMessage message = classMessageService.sendMessage(classId, senderId, content, type, fileUrl);
        return R.ok(message);
    }

    @GetMapping("/{classId}/recent-messages")
    public R<List<SysClassMessage>> getRecentMessages(@PathVariable Long classId, 
                                                      @RequestParam(defaultValue = "50") Integer limit) {
        return R.ok(classMessageService.getRecentMessages(classId, limit));
    }

    @GetMapping("/{classId}/member/{userId}/check")
    public R<Map<String, Object>> checkMemberRole(@PathVariable Long classId, @PathVariable Long userId) {
        Map<String, Object> result = new HashMap<>();
        SysClassMember member = classMemberService.getMember(classId, userId);
        
        if (member == null) {
            result.put("isMember", false);
            result.put("role", null);
            result.put("isMuted", false);
        } else {
            result.put("isMember", true);
            result.put("role", member.getRole());
            result.put("isMuted", classMemberService.isMuted(classId, userId));
            result.put("isOwner", "OWNER".equals(member.getRole()));
            result.put("isAdmin", classMemberService.isAdmin(classId, userId));
        }
        
        return R.ok(result);
    }

    private String getUsername(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            try {
                String payload = token.split("\\.")[1];
                byte[] decoded = java.util.Base64.getUrlDecoder().decode(payload);
                String json = new String(decoded);
                int start = json.indexOf("\"username\":\"") + 12;
                int end = json.indexOf("\"", start);
                return json.substring(start, end);
            } catch (Exception e) {
                return "anonymous";
            }
        }
        return "anonymous";
    }
}