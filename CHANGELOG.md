# Changelog

## v1.0.1 (2026-06-22)

### 🐛 Bug 修复
- **注释编号不复位问题**：删除注释后新增，编号不再从最大编号递增，改为自动扫描并复用已删除的编号
  - 移除了全局 `_nextId` 计数器
  - 新增 `getNextAnnotationId()` 函数，使用 `Set` 收集现有编号，返回最小未使用值
  - 同步清理 `clearAnnotations()` 中已废弃的 `_nextId = 1` 重置逻辑

### 🔧 优化
- **项目结构调整**：文件从 `pm-prototype-prd/` 子目录移至仓库根目录，`git clone` 后直接可见
