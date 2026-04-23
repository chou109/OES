package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.config.JwtUtils;
import com.oes.entity.SysUser;
import com.oes.service.SysUserService;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SysUserService sysUserService;
    private final JwtUtils jwtUtils;

    public AuthController(SysUserService sysUserService, JwtUtils jwtUtils) {
        this.sysUserService = sysUserService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public R<Map<String, Object>> login(@RequestBody SysUser user) {
        SysUser dbUser = sysUserService.getByUsername(user.getUsername());
        if (dbUser == null) {
            return R.error("用户不存在");
        }
        if (dbUser.getStatus() == 0) {
            return R.error("用户已被禁用");
        }

        String token = jwtUtils.generateToken(dbUser.getId(), dbUser.getUsername(), dbUser.getRole());

        Map<String, Object> data = Map.of(
                "token", token,
                "userId", dbUser.getId(),
                "username", dbUser.getUsername(),
                "realName", dbUser.getRealName(),
                "role", dbUser.getRole(),
                "avatar", dbUser.getAvatar() != null ? dbUser.getAvatar() : ""
        );
        return R.ok(data);
    }

    @GetMapping("/info")
    public R<Map<String, Object>> getUserInfo(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long userId = jwtUtils.getUserIdFromToken(token);
        SysUser user = sysUserService.getById(userId);
        if (user == null) {
            return R.unauthorized();
        }

        Map<String, Object> data = Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "realName", user.getRealName(),
                "role", user.getRole(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "phone", user.getPhone() != null ? user.getPhone() : ""
        );
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
