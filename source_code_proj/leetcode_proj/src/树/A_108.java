package 树;

public class A_108 {
    public TreeNode sortedArrayToBST(int[] nums) {
        return merge(nums, 0, nums.length-1);
    }
    TreeNode merge(int[] nums, int left, int right) {
        if (left > right) {
            return null;
        }
        if (left == right) {
            return new TreeNode(nums[left]);
        }
        int mid = left + (right-left)/2;
        TreeNode root = new TreeNode(nums[mid]);
        root.left = merge(nums, left, mid-1);
        root.right = merge(nums, mid+1, right);
        return root;
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
