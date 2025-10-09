export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow literal UI text in JSX" },
    schema: [],
    messages: {
      noText: "Literal UI text should be translated (use t()/<Trans>): {{text}}",
    },
  },
  create(context) {
    const isOnlyPunctOrSpace = (s) =>
      /^[\s~`!@#$%^&*()\-_=+[\]{};:'",.<>/?|\\]*$/.test(s);

    const reportIfText = (raw, node) => {
      const text = String(raw ?? "").trim();
      if (text && !isOnlyPunctOrSpace(text)) {
        context.report({ node, messageId: "noText", data: { text } });
      }
    };

    return {
      // <div>Text</div>
      JSXText(node) {
        reportIfText(node.value, node);
      },

      // <div>{'Text'}</div> hoặc <div>{"Text"}</div>
      JSXExpressionContainer(node) {
        // ❗ Chỉ bắt khi expression container là con trực tiếp của JSXElement/Fragment (text giữa thẻ)
        const p = node.parent;
        if (!p || (p.type !== "JSXElement" && p.type !== "JSXFragment")) {
          // => Nằm trong thuộc tính (JSXAttribute) hoặc chỗ khác => bỏ qua
          return;
        }

        const expr = node.expression;
        if (!expr) return;

        // Chỉ bắt literal string thực sự
        if (expr.type === "Literal" && typeof expr.value === "string") {
          reportIfText(expr.value, node);
          return;
        }

        if (expr.type === "TemplateLiteral") {
          // chỉ khi template thuần text, không có expressions
          if (expr.expressions.length === 0 && expr.quasis.length === 1) {
            reportIfText(expr.quasis[0].value.cooked, node);
          }
        }
      },
    };
  },
};
