import React, { useState, useEffect } from 'react';
import './PermissionModal.css';
import axios from 'axios';

const PermissionModal = ({ route, onClose, onPermissionsChange }) => {
  const [permission, setPermission] = useState(route.permissions.type || 'private');
  const [friends, setFriends] = useState(route.permissions.friends.map(friend => friend._id) || []);

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:3000/update-permissions', {
        userId: 1, // 确保传递正确的 userId
        routeId: route.routeId, // 确保 route 对象包含有效的 routeId
        permissionType: permission,
        friends: permission === 'friends' ? friends : []
      });
      console.log(`Permissions updated for route ${route.name}`);
      onPermissionsChange(route.routeId, { type: permission, friends }); 
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>設定權限</h2>
        <p>為路線 "{route.name}" 選擇權限設置：</p>
        <div>
          <label>
            <input 
              type="radio" 
              value="public" 
              checked={permission === 'public'} 
              onChange={(e) => setPermission(e.target.value)} 
            />
            公開編輯
          </label>
        </div>
        <div>
          <label>
            <input 
              type="radio" 
              value="friends" 
              checked={permission === 'friends'} 
              onChange={(e) => setPermission(e.target.value)} 
            />
            選擇好友編輯
          </label>
        </div>
        {permission === 'friends' && (
          <div>
            <label>
              好友列表: 
              <input 
                type="text" 
                value={friends.join(', ')} 
                onChange={(e) => setFriends(e.target.value.split(',').map(f => f.trim()))} 
              />
            </label>
          </div>
        )}
        <div>
          <label>
            <input 
              type="radio" 
              value="private" 
              checked={permission === 'private'} 
              onChange={(e) => setPermission(e.target.value)} 
            />
            個人編輯
          </label>
        </div>
        <button onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default PermissionModal;
