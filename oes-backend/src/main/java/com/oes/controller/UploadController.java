package com.oes.controller;

import com.oes.common.base.R;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @PostMapping("/avatar")
    public R<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return R.error("文件不能为空");
        }

        try {
            // 使用项目根目录作为上传路径
            String projectPath = System.getProperty("user.dir");
            String uploadPath = projectPath + "/uploads";
            
            // 确保上传目录存在
            File baseDir = new File(uploadPath + "/avatars" + "/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd")));
            if (!baseDir.exists()) {
                boolean created = baseDir.mkdirs();
                if (!created) {
                    return R.error("无法创建上传目录");
                }
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = "avatar_" + UUID.randomUUID() + suffix;

            // 保存文件
            File dest = new File(baseDir, filename);
            file.transferTo(dest);

            // 生成访问路径
            String avatarUrl = "/uploads/avatars/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd")) + "/" + filename;
            return R.ok(avatarUrl);

        } catch (IOException e) {
            e.printStackTrace();
            return R.error("上传失败：" + e.getMessage());
        }
    }
}