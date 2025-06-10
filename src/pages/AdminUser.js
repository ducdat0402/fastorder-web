import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../services/api';
import { toast } from 'react-toastify';

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách user khi load trang
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  // Đổi quyền user
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated!');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  // Xóa user
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      toast.success('User deleted!');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin User Management</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUser;