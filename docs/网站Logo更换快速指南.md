# 🚀 网站Logo更换快速指南

## 📍 Logo类型

网站有两种Logo：

1. **页面Logo** - 显示在网站顶部导航栏
2. **Favicon** - 显示在浏览器标签页

---

## ⚡ 方法一：更换页面Logo（3步）

### 步骤1：上传Logo到图床

选择任一图床上传您的Logo：

- **ImgBB**: https://imgbb.com/ （推荐）
- **Imgur**: https://imgur.com/
- **SM.MS**: https://sm.ms/

上传后复制图片的直接链接（Direct link）

### 步骤2：配置到管理后台

```
1. 登录网站 → 点击右上角头像 → 管理后台
2. 左侧菜单 → 网站配置 → 网站信息配置
3. 找到"网站Logo图片"部分
4. 点击"输入URL"按钮
5. 粘贴图片链接
6. 点击"保存更改"
```

### 步骤3：验证效果

访问首页，检查顶部导航栏是否显示新Logo

---

## ⚡ 方法二：更换Favicon（3步）

### 步骤1：准备Favicon文件

- 格式：PNG（推荐）
- 尺寸：32x32 像素
- 文件名：`favicon.png`

**可选：使用在线工具生成**
- https://favicon.io/

### 步骤2：替换文件

**Linux/Mac：**
```bash
cd /workspace/app-800go8thhcsh
cp /path/to/your/new-favicon.png public/favicon.png
```

**Windows：**
1. 打开项目文件夹
2. 进入 `public` 文件夹
3. 将新的 `favicon.png` 复制到此文件夹（覆盖原文件）

### 步骤3：清除缓存并验证

1. 清除浏览器缓存：`Ctrl+Shift+Delete`
2. 或使用隐私模式测试
3. 访问网站，检查标签页图标

---

## 📊 Logo要求

### 页面Logo

| 项目 | 要求 |
|------|------|
| 格式 | PNG（推荐）、SVG、JPG |
| 尺寸 | 宽度200-400px，高度40-80px |
| 背景 | 透明背景（推荐） |
| 大小 | < 2MB |

### Favicon

| 项目 | 要求 |
|------|------|
| 格式 | PNG（推荐）、ICO、SVG |
| 尺寸 | 16x16、32x32、48x48 像素 |
| 背景 | 透明背景（推荐） |
| 设计 | 简洁清晰，小尺寸下可识别 |

---

## ⚠️ 常见问题

### Q: 页面Logo上传失败？
**A:** 使用"输入URL"方式代替文件上传

### Q: Favicon还是显示旧图标？
**A:** 清除浏览器缓存（Ctrl+Shift+Delete）或使用隐私模式

### Q: Logo显示变形？
**A:** 检查图片尺寸比例，推荐使用横向Logo

### Q: 图床链接失效？
**A:** 重新上传到可靠图床（推荐ImgBB或Imgur）

---

## 🎯 完整流程

```
页面Logo更换：
准备Logo → 上传图床 → 获取URL → 管理后台配置 → 保存 → 验证

Favicon更换：
准备图标 → 替换文件 → 清除缓存 → 验证
```

---

## 🔗 推荐工具

**图床服务：**
- ImgBB: https://imgbb.com/
- Imgur: https://imgur.com/
- SM.MS: https://sm.ms/

**Favicon生成：**
- Favicon.io: https://favicon.io/
- RealFaviconGenerator: https://realfavicongenerator.net/

**图片编辑：**
- Photopea: https://www.photopea.com/
- TinyPNG: https://tinypng.com/ （压缩）
- Remove.bg: https://www.remove.bg/ （去背景）

---

## 📚 详细文档

完整的操作指南请查看：**网站Logo更换完整指南.md**

包含内容：
- ✅ 详细的操作步骤（带截图说明）
- ✅ 多种配置方案
- ✅ 设计建议和最佳实践
- ✅ 完整的常见问题解答
- ✅ 测试验证清单
- ✅ 相关文件位置说明

---

**快速参考版本：** v1.0  
**更新时间：** 2025-12-04

**祝您顺利完成Logo更换！** 🎉
