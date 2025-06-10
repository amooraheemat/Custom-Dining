import { sequelize, connectDB }  from '../config/database.js';
import { DataTypes, GEOMETRY } from 'sequelize';
import { Json } from 'sequelize/lib/utils';
import { generateHTML } from 'swagger-ui-express';

const meal = sequelize.define('meal', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: { 
        type: DataTypes.TEXT,
        allowNull: false,
    },  
    
    /*Dietary Tags: Stored as comma-separated string for simplicity or JSON array
     For more complex querying/indexing, a separate Tag model and many-to-many would be better.
     For this functional solution, string array is sufficient. */
    dietaryTags: {
        type: DataTypes.JSON, // Use JSON type for better flexibility with arrays
        allowNull: true,
        defaultValue: [],
        get() {
            return this.getDataValue('dietaryTags')?.split(',') || [];    
        },
        set(val) {
            this.setDataValue('dietaryTags', JSON,strigify(val));
        }
     }, 

     // Nutritional Info: Stored as JSON
     nutritionalInfo: {
        type: DataTypes.JSON, // optional: store protein, fat, etc. as JSON
        allowNull: true,
        defaultValue: {},
        get() {
            return this.getDataValue('nutritionallnfo');
        },
        set(val) {
            this.setDataValue('nutritionallnfo', JSON.stringify(val));
        }
    },

    // Allergens: Stored as a JSON array of strings
     allergens: {
        type: DataTypes.JSON, // Use JSON type for better flexibility with arrays

        get() {
            return thise.getDataValue('allergens')?.split(',') || []; 
        },
        set(val) {
            this.setDataValue('allergens', JSON.stringify(val));
        }
     },
});


export default meal;