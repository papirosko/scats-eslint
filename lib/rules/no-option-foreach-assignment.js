'use strict';

const MESSAGE_ID = 'noOptionForeachAssignment';

function isNone(node) {
  return node && node.type === 'Identifier' && node.name === 'none';
}

function isSomeCall(node) {
  return node
    && node.type === 'CallExpression'
    && node.callee.type === 'Identifier'
    && node.callee.name === 'some';
}

function getForeachCallback(node) {
  if (node.type !== 'CallExpression') {
    return null;
  }

  const callee = node.callee;

  if (
    callee.type !== 'MemberExpression'
    || callee.computed
    || callee.property.type !== 'Identifier'
    || callee.property.name !== 'foreach'
  ) {
    return null;
  }

  if (node.arguments.length !== 1) {
    return null;
  }

  const callback = node.arguments[0];

  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') {
    return null;
  }

  return callback;
}

function findAssignments(callbackBody, variableName) {
  const assignments = [];
  const seen = new Set();

  function visit(node, visitorKeys) {
    if (!node || typeof node.type !== 'string') {
      return;
    }

    if (seen.has(node)) {
      return;
    }

    seen.add(node);

    if (
      node.type === 'AssignmentExpression'
      && node.operator === '='
      && node.left.type === 'Identifier'
      && node.left.name === variableName
      && (isSomeCall(node.right) || isNone(node.right))
    ) {
      assignments.push(node);
    }

    const keys = visitorKeys[node.type] || [];

    for (const key of keys) {
      const value = node[key];

      if (!value) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          visit(item, visitorKeys);
        }
        continue;
      }

      if (value && typeof value.type === 'string') {
        visit(value, visitorKeys);
      }
    }
  }

  return {
    collect(visitorKeys) {
      visit(callbackBody, visitorKeys);
      return assignments;
    },
  };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow mutating Option variables inside `foreach`; prefer `map`/`flatMap` expression chains',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not assign to an `Option` variable inside `foreach`; prefer deriving it with `map` or `flatMap`.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const visitorKeys = sourceCode.visitorKeys;

    return {
      VariableDeclaration(node) {
        if (node.kind !== 'let') {
          return;
        }

        if (
          !node.parent
          || (node.parent.type !== 'Program' && node.parent.type !== 'BlockStatement')
          || !Array.isArray(node.parent.body)
        ) {
          return;
        }

        for (const declaration of node.declarations) {
          if (
            declaration.type !== 'VariableDeclarator'
            || declaration.id.type !== 'Identifier'
            || !isNone(declaration.init)
          ) {
            continue;
          }

          const variableName = declaration.id.name;
          const statementIndex = node.parent.body.indexOf(node);

          if (statementIndex === -1) {
            continue;
          }

          for (let i = statementIndex + 1; i < node.parent.body.length; i += 1) {
            const statement = node.parent.body[i];
            const expression = statement.type === 'ExpressionStatement' ? statement.expression : null;
            const callback = expression ? getForeachCallback(expression) : null;

            if (!callback) {
              continue;
            }

            const assignments = findAssignments(callback.body, variableName).collect(visitorKeys);

            for (const assignment of assignments) {
              context.report({
                node: assignment,
                messageId: MESSAGE_ID,
              });
            }
          }
        }
      },
    };
  },
};
