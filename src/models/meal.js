import { DataTypes, GEOMETRY } from 'sequelize';
import { sequelize } from '../config/database';
import { generateHTML } from 'swagger-ui-express';

const meal = sequelize.define('Meal', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: DataTypes.TEXT,
    tags: {
        type: DataTypes.STRING, // store as comma-separated string
        get() {
            return this.getDataValue('tags')?.split(',') || [];    
        },
        set(val) {
            this.setDataValue('tags', val.join(','));
        },
     },

     nutritionalInfo: {
        type: DataTypes.JSON, // optional: store protein, fat, etc. as JSON
     },
     allergens: {
        type: DataTypes.STRING, //Also comma-separated
        get() {
            return thise.getDataValue('allergens')?.split(',') || []; 
        },
        set(val) {
            this.setDataValue('allergens', val.join(','));
        },
     },
});


export default meal;