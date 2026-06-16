package com.oes.controller;

import com.oes.annotation.Log;
import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.config.JwtUtils;
import com.oes.entity.SysUser;
import com.oes.service.SysUserService;
import com.oes.service.SysLogService;
import javax.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SysUserService sysUserService;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final SysLogService sysLogService;

    public AuthController(SysUserService sysUserService, JwtUtils jwtUtils, PasswordEncoder passwordEncoder, SysLogService sysLogService) {
        this.sysUserService = sysUserService;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.sysLogService = sysLogService;
    }

    @PostMapping("/login")
    public R<Map<String, Object>> login(@RequestBody SysUser user, HttpServletRequest request) {
        try {
            SysUser dbUser = sysUserService.getByUsername(user.getUsername());
            if (dbUser == null) {
                return R.error("用户不存在");
            }
            if (dbUser.getStatus() == 0) {
                return R.error("用户已被禁用");
            }
            if (!passwordEncoder.matches(user.getPassword(), dbUser.getPassword())) {
                return R.error("密码错误");
            }

            String token = jwtUtils.generateToken(dbUser.getId(), dbUser.getUsername(), dbUser.getRole());

            try {
                String ip = request.getRemoteAddr();
                sysLogService.saveLog(dbUser.getUsername(), "用户登录", "POST /api/auth/login", 
                        "{\"username\":\"" + user.getUsername() + "\"}", ip);
            } catch (Exception e) {
                e.printStackTrace();
            }

            Map<String, Object> data = new java.util.HashMap<>();
            data.put("token", token);
            data.put("userId", dbUser.getId());
            data.put("username", dbUser.getUsername());
            data.put("realName", dbUser.getRealName() != null ? dbUser.getRealName() : "");
            data.put("role", dbUser.getRole());
            data.put("avatar", dbUser.getAvatar() != null ? dbUser.getAvatar() : "");
            return R.ok(data);
        } catch (Exception e) {
            e.printStackTrace();
            return R.error("登录失败: " + e.getMessage());
        }
    }

    @GetMapping("/info")
    public R<Map<String, Object>> getUserInfo(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return R.unauthorized();
        }
        String token = authorization.replace("Bearer ", "");
        if (token == null || token.isEmpty()) {
            return R.unauthorized();
        }
        Long userId;
        try {
            userId = jwtUtils.getUserIdFromToken(token);
        } catch (Exception e) {
            return R.unauthorized();
        }
        if (userId == null) {
            return R.unauthorized();
        }
        SysUser user = sysUserService.getById(userId);
        if (user == null) {
            return R.unauthorized();
        }

        Map<String, Object> data = new java.util.HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("realName", user.getRealName() != null ? user.getRealName() : "");
        data.put("role", user.getRole() != null ? user.getRole() : "");
        data.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
        data.put("email", user.getEmail() != null ? user.getEmail() : "");
        data.put("phone", user.getPhone() != null ? user.getPhone() : "");
        data.put("departmentId", null);
        return R.ok(data);
    }

    @PostMapping("/register")
    public R<Void> register(@RequestBody SysUser user) {
        try {
            boolean result = sysUserService.register(user);
            return result ? R.ok() : R.error("注册失败");
        } catch (Exception e) {
            return R.error(e.getMessage());
        }
    }

    @PostMapping("/changePassword")
    public R<Void> changePassword(@RequestBody Map<String, String> params, HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long userId = jwtUtils.getUserIdFromToken(token);
        try {
            boolean result = sysUserService.changePassword(
                    userId,
                    params.get("oldPassword"),
                    params.get("newPassword")
            );
            return result ? R.ok() : R.error("修改失败");
        } catch (Exception e) {
            return R.error(e.getMessage());
        }
    }
}
