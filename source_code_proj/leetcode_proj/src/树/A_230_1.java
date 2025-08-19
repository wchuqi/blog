package 树;

import java.util.ArrayDeque;
import java.util.Deque;

public class A_230_1 {
    int cnt = 0;
    public int kthSmallest(TreeNode root, int k) {
        cnt = k;
        Deque<Command> queue = new ArrayDeque<>();
        queue.push(new Command(1, root));
        while (!queue.isEmpty()) {
            Command temp = queue.pop();
            if (temp.type == 0) {
                cnt--;
                if (cnt == 0) {
                    return temp.node.val;
                }
            } else {
                // 中序遍历，这里是right入栈，然后left后入栈
                if (temp.node.right != null) {
                    queue.push(new Command(1, temp.node.right));
                }
                temp.type=0;
                queue.push(temp);
                if (temp.node.left != null) {
                    queue.push(new Command(1, temp.node.left));
                }
            }
        }
        return -1;
    }
    class Command {
        int type;
        TreeNode node;
        public Command(int type, TreeNode node) {
            this.type = type;
            this.node = node;
        }
    }
    class TreeNode {
      int val;
      TreeNode left;
      TreeNode right;
      TreeNode() {}
      TreeNode(int val) { this.val = val; }
      TreeNode(int val, TreeNode left, TreeNode right) {
          this.val = val;
          this.left = left;
          this.right = right;
      }
    }
}
