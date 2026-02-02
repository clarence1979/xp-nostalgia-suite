/*
  # Add User Management Icon

  1. Changes
    - Add User Management desktop icon for admin users
    - Position it appropriately on the desktop
  
  2. Icon Details
    - Name: User Management
    - Icon: UserCog (system icon)
    - Only accessible to admin users
    - Opens user management panel
*/

-- Add User Management icon
INSERT INTO desktop_icons (
  name,
  icon,
  description,
  url,
  icon_type,
  position_x,
  position_y,
  position_x_mobile,
  position_y_mobile,
  category,
  open_behavior,
  sort_order
) VALUES (
  'User Management',
  'UserCog',
  'Manage users and permissions (Admin only)',
  null,
  'system',
  20,
  500,
  20,
  500,
  null,
  'special',
  31
);