# states：交互状态、表单、空态、边界

界面"看起来完成"和"实际能用"的差距全在这一页。

## 1. 控件的八态

每个可交互元素都要有：

| 状态 | 要求 |
|---|---|
| default | 有边界或底色，明确可点 |
| hover | ≤2px 位移或底色变化，不改变布局 |
| active | 按下有轻微反馈（`translateY(0.5px)` / 更深的底色） |
| focus-visible | 2px 实心环 + offset，**不做延迟、不靠动画淡入** |
| disabled | 降透明度 + `cursor: not-allowed` + 不可聚焦（`disabled` 属性，不是 `pointer-events` 糊） |
| loading | 保持宽度不变，内容换 spinner/骨架，禁用重复提交 |
| error | 边框/文字用状态色，并在控件旁说明原因 |
| selected/checked | 有形状差异（勾选、加粗、边框），不只靠颜色 |

```css
.control { min-height: 44px; transition: background-color 150ms var(--ease-forge), transform 150ms var(--ease-forge); }
.control:hover { transform: translateY(-1px); }
.control:active { transform: translateY(0); }
.control:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.control[disabled] { opacity: .5; cursor: not-allowed; }
.control[aria-busy="true"] { cursor: progress; }
```

## 2. 表单

- 每个输入都有 `<label for>`；placeholder 只放示例（"例如：hello@example.com"），不放字段名。
- 必填用 `required` + 文案说明；不要只用红星号。
- 校验时机：失焦校验格式，提交校验全部；错误文案三段式（哪里错 / 为什么 / 怎么改）。
- 错误必须 `aria-describedby` 关联到输入框；`aria-invalid="true"`。
- 一个表单只允许一个主按钮；危险动作（删除、清空）不与主按钮并排同色。
- 输入框 `font-size ≥ 16px`（iOS 会缩放更小的字号）。
- 密码框给"显示/隐藏"；长表单分组并给进度，不要一屏 20 个字段。
- 提交成功后按钮回到可用状态，并给明确结果（"已发送到 hello@example.com"）。

```html
<label for="email">邮箱</label>
<input id="email" name="email" type="email" required
       autocomplete="email" aria-describedby="email-hint email-error">
<p id="email-hint">用来接收每周摘要，随时可退订。</p>
<p id="email-error" role="alert" hidden>邮箱格式不对：缺少 @ 后面的域名。</p>
```

## 3. 空态 / 加载 / 错误 / 无权限

每个异步区块都要四态齐全：

| 态 | 内容 | 禁忌 |
|---|---|---|
| empty | 为什么空 + 下一步做什么（一个主操作） | "暂无数据"几个字了事 |
| loading | 结构与最终内容同形的骨架（不是居中 spinner） | 骨架尺寸和真实内容不一致导致跳动 |
| error | 发生了什么 + 重试按钮 + 联系方式 | 只显示 "Error" 或错误码 |
| no-permission | 说明缺什么权限 + 申请入口 | 假装是空数据 |

## 4. 键盘与读屏

- 焦点顺序 = 视觉顺序；不要用 `tabindex` 正数调序。
- 弹窗：打开时焦点进入，`Esc` 关闭，关闭后焦点回到触发元素，背景 `inert`。
- 跳过导航链接（skip link）在页面首个可聚焦元素。
- 图标按钮必须有 `aria-label`；纯装饰图形 `aria-hidden="true"`。
- 状态变化用 `role="status"` / `role="alert"`；不要只靠颜色传达（色盲）。
- 语言：`<html lang>`；混排外语时局部 `lang` 属性。

## 5. 触控与响应

- 触控目标 ≥44×44，相邻目标间距 ≥8px。
- 320px 宽不横向滚动；长单词/URL 用 `overflow-wrap: anywhere`。
- 悬停才出现的信息，必须有触摸可达的替代（点击展开），因为没有 hover。
- 固定底部操作条要给内容留 `padding-bottom`，别盖住最后一行。
- 表格窄屏：改纵向卡片列表；必须横滚时，首列固定并给滚动提示。

## 6. 内容边界

- 超长标题：`overflow-wrap: break-word; min-width: 0;`，容器 `minmax(0,1fr)`。
- 空字符串/单字符：布局不塌（用 `:empty` 占位或最小行高）。
- 数字：等宽 + `font-variant-numeric: tabular-nums`，右对齐；单位与数字间不换行（`white-space: nowrap`）。
- 用户输入渲染要转义；不允许把 HTML 直接塞进页面。
- 时区/日期格式统一，不要一处 `2026-10-27` 一处 `10/27`。
- 图片缺失：给 `alt` 兜底样式和固定 `aspect-ratio`，不要塌成 0 高。

## 7. 暗色模式

- 两个模式都过对比度；彩色底上的文字在两个模式里分别算。
- 图片在暗色下降低亮度（`filter: brightness(.9)`）或加深色遮罩，别让白底截图刺眼。
- 阴影在暗色下几乎无效，改用 1px border 或提亮底面。
- `color-scheme` 必须跟着切换，否则原生控件（滚动条、输入框）会不同步。

## 8. 打包前的自检

- [ ] 每个按钮、链接、输入都有可见焦点。
- [ ] 表单能提交、能报错、错误能定位到字段。
- [ ] 空/加载/错误/无权限四态都有真实文案。
- [ ] 320px 无横向滚动；触控目标达标。
- [ ] 关掉 JS，主要内容仍可读。
- [ ] `prefers-reduced-motion` 下没有动画。
- [ ] 键盘能走完全流程，弹窗能 `Esc` 退出。
