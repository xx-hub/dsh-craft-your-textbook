# 例题演练（Worked Example）

## 解决什么教学问题
需要展示"怎么做"的程序性知识——例题/代码/计算题/标准流程怎么写得让学生能跟着走一遍。

## 什么时候用 / 什么时候不用
- 用：编程/数学/物理/审计程序设计/任何"需要看一个完整示范"的技能
- 不用：纯概念理解（application-problem 更合适）；判断偏好（judgment-card）
- 典型搭配：application-problem（先 worked-example 示范，再让学生做）

## 长什么样（结构示例）

编程类：
```markdown
### 例：用递归算斐波那契数列

**问题**：写一个函数 fib(n) 返回第 n 个斐波那契数。

**新手常写的版本（有问题）**：
```python
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```
问题：重复计算，fib(5) 会算两次 fib(3)，n=40 就明显变慢。

**改进版本（带缓存）**：
```python
from functools import lru_cache
@lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```
关键改进：@lru_cache 缓存已计算结果，时间复杂度从 O(2^n) 降到 O(n)。
```

数学/审计同理：完整展示一道题的解题过程，标注关键步骤和常见错在哪。

以上编程示例为构造示例。真实教材中，worked-example 的形态因学科而异：CPA 审计教材的 worked-example 形态为审计程序设计题（见 CPA Ch1），其结构更接近 application-problem + worked-example 的混合体。

## 已知陷阱
- ❌ 跳过中间步骤直接给最终代码/答案 → 学生看不出"怎么想到的"
- ❌ 例子太小太 trivial（print("hello")）→ 不具示范价值
- ❌ 例子太大超过一章范围 → 拆成多章或者简化

## 变体
- **审计/法律版**：展示完整的审计程序设计/法律文书撰写流程
- **blueprint**：可作为 AI 老师的"标准答题模板"

## 不要这样用
- ❌ worked-example 替代学生自己做的 application-problem——示范+练习要搭配