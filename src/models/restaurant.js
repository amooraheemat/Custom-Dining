import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Restaurant = sequelize.define ('Restaurant', {
  id: { 
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  meals: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
},
{
  timestamps: true,
  tableName: 'restaurants',
}
);



export default Restaurant;
