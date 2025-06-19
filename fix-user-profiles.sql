-- Disable foreign key checks to avoid issues with constraints
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the existing user_profiles table if it exists
DROP TABLE IF EXISTS user_profiles;

-- Create the user_profiles table with the correct structure and collation
CREATE TABLE user_profiles (
  id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (UUID()),
  userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  healthGoal VARCHAR(255) NULL,
  dietaryRestrictions JSON NULL,
  preferredMealTags JSON NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_profiles_userId_idx (userId),
  CONSTRAINT user_profiles_userId_fk 
    FOREIGN KEY (userId) 
    REFERENCES Users (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify the changes
SHOW CREATE TABLE user_profiles;
