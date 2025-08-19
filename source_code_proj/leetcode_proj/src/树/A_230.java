package 树;

public class A_230 {
    int cnt = 0;
    int res = 0;
    public int kthSmallest(TreeNode root, int k) {
        cnt = k;
        dfs(root);
        return res;
    }
    void dfs(TreeNode root) {
        if (root == null) {
            return;
        }
        dfs(root.left);
        // 中序遍历
        cnt--;
        if (cnt == 0) {
            this.res = root.val;
        }
        dfs(root.right);
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
