'use strict';

const MESSAGE_ID = 'preferEmptyCollection';

const SCATS_COLLECTIONS = new Set([
  'ArrayBuffer',
  'Collection',
  'HashMap',
  'HashSet',
]);

function getStaticFactoryName(node) {
  if (!node || node.type !== 'CallExpression') {
    return null;
  }

  const callee = node.callee;

  if (!callee || callee.type !== 'MemberExpression' || callee.computed) {
    return null;
  }

  if (callee.object.type !== 'Identifier' || callee.property.type !== 'Identifier') {
    return null;
  }

  if (!SCATS_COLLECTIONS.has(callee.object.name)) {
    return null;
  }

  return {
    collectionName: callee.object.name,
    methodName: callee.property.name,
  };
}

function isEmptyIterableExpression(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'ArrayExpression') {
    return node.elements.length === 0;
  }

  if (node.type === 'NewExpression' && node.callee.type === 'Identifier') {
    const hasArguments = node.arguments && node.arguments.length > 0;
    return !hasArguments && (node.callee.name === 'Set' || node.callee.name === 'Map');
  }

  return false;
}

function getPreferredEmptyValue(collectionName) {
  return collectionName === 'Collection' ? 'Nil or Collection.empty' : `${collectionName}.empty`;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow explicit construction of empty scats collections',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use {{preferred}} instead of constructing an empty {{collectionName}} via {{collectionName}}.{{methodName}}.',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const factory = getStaticFactoryName(node);

        if (!factory) {
          return;
        }

        const { collectionName, methodName } = factory;
        let shouldReport = false;

        if (methodName === 'of') {
          shouldReport = node.arguments.length === 0;
        } else if (methodName === 'from') {
          shouldReport = node.arguments.length === 1 && isEmptyIterableExpression(node.arguments[0]);
        }

        if (!shouldReport) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
          data: {
            collectionName,
            methodName,
            preferred: getPreferredEmptyValue(collectionName),
          },
        });
      },
    };
  },
};
