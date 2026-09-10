"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** 初始 HTML（只在挂载时注入一次） */
  initialHtml: string;
  className?: string;
  /** 每次输入回调，参数是该元素本身（父组件读 innerHTML / innerText） */
  onInput?: (el: HTMLElement) => void;
  ariaLabel?: string;
  placeholder?: string;
};

/**
 * 可编辑富文本块。
 *
 * 关键点：**非受控**。React 只在挂载时把 initialHtml 写进 DOM，之后内容完全由
 * 用户和浏览器接管 —— 如果用 state 受控回写，每次按键都会重设 innerHTML，
 * 光标会跳到开头。父组件通过 onInput 拿到元素引用，导出时再读 innerHTML。
 */
export default function Editable({
  initialHtml,
  className,
  onInput,
  ariaLabel,
  placeholder,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml;
    // 仅挂载时注入一次；initialHtml 变化不重设，避免打断用户正在进行的编辑。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      spellCheck
      className={className}
      onInput={() => {
        if (ref.current) onInput?.(ref.current);
      }}
    />
  );
}
