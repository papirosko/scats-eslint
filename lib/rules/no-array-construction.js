'use strict';

const MESSAGE_ID = 'noArrayConstruction';

const TUPLE_FACTORY_METHODS = new Set(['of', 'from']);
const TUPLE_INSTANCE_METHODS = new Set(['addOne', 'addAll']);
const TUPLE_MAPPER_METHODS = new Set(['toMap', 'yield']);

function isFunctionNode(node) {
  return node && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression');
}

function isIdentifier(node, name) {
  return node && node.type === 'Identifier' && node.name === name;
}

function isStaticMember(object, property, objectName, propertyName) {
  return object
    && object.type === 'MemberExpression'
    && !object.computed
    && isIdentifier(object.object, objectName)
    && isIdentifier(object.property, propertyName)
    && isIdentifier(property, propertyName);
}

function isHashMapFactoryCall(call) {
  const callee = call.callee;

  if (!callee || callee.type !== 'MemberExpression' || callee.computed) {
    return false;
  }

  const methodName = callee.property.type === 'Identifier' ? callee.property.name : null;

  if (!methodName || !TUPLE_FACTORY_METHODS.has(methodName)) {
    return false;
  }

  if (isIdentifier(callee.object, 'HashMap')) {
    return true;
  }

  return callee.object.type === 'MemberExpression'
    && !callee.object.computed
    && isIdentifier(callee.object.object, 'mutable')
    && isIdentifier(callee.object.property, 'HashMap');
}

function isTupleInstanceMethodCall(call) {
  const callee = call.callee;

  return callee
    && callee.type === 'MemberExpression'
    && !callee.computed
    && callee.property.type === 'Identifier'
    && TUPLE_INSTANCE_METHODS.has(callee.property.name);
}

function isAllowedTupleArgument(node) {
  let current = node;
  let parent = node.parent;

  while (parent && parent.type === 'ArrayExpression') {
    current = parent;
    parent = parent.parent;
  }

  if (!parent || parent.type !== 'CallExpression') {
    return false;
  }

  if (!parent.arguments.includes(current)) {
    return false;
  }

  return isHashMapFactoryCall(parent) || isTupleInstanceMethodCall(parent);
}

function isAllowedTupleMapper(node) {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (parent.type === 'ArrowFunctionExpression' && parent.body === node) {
    return isTupleMapper(parent);
  }

  if (parent.type === 'ReturnStatement') {
    const fn = parent.parent;
    return isFunctionNode(fn) && isTupleMapper(fn);
  }

  return false;
}

function isTupleMapper(node) {
  const call = node.parent;

  if (!call || call.type !== 'CallExpression') {
    return false;
  }

  if (call.arguments[0] !== node) {
    return false;
  }

  const callee = call.callee;

  return callee.type === 'MemberExpression'
    && !callee.computed
    && callee.property.type === 'Identifier'
    && TUPLE_MAPPER_METHODS.has(callee.property.name);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow direct JavaScript array construction in strict scats mode',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not construct JavaScript arrays directly; use scats collections instead.',
    },
  },

  create(context) {
    return {
      ArrayExpression(node) {
        if (isAllowedTupleMapper(node) || isAllowedTupleArgument(node)) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
        });
      },

      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Array') {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
        });
      },

      NewExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Array') {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
