const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseCategories() {
  try {
    // Read the Excel file
    const workbook = xlsx.readFile('./Categories.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    console.log('Sample data structure:');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
    
    // Build hierarchical structure
    const categoryHierarchy = {};
    
    // Create a mapping of category IDs to titles
    const categoryTitles = {};
    data.forEach(row => {
      const categoryId = row['Name']?.trim();
      const categoryTitle = row['Category Title']?.trim();
      if (categoryId && categoryTitle) {
        categoryTitles[categoryId] = categoryTitle;
      }
    });
    
    data.forEach(row => {
      const category1Id = row['Category1.Name']?.trim();
      const category2Id = row['Category2.Name']?.trim();
      const category3Id = row['Category3.Name']?.trim();
      
      if (!category1Id) return;
      
      // Get the actual names from the mapping
      const category1 = categoryTitles[category1Id] || category1Id;
      const category2 = categoryTitles[category2Id] || category2Id;
      const category3 = categoryTitles[category3Id] || category3Id;
      
      // Initialize category1 if it doesn't exist
      if (!categoryHierarchy[category1]) {
        categoryHierarchy[category1] = {
          name: category1,
          id: category1Id,
          children: {}
        };
      }
      
      // Add category2 if it exists
      if (category2Id && category2) {
        if (!categoryHierarchy[category1].children[category2]) {
          categoryHierarchy[category1].children[category2] = {
            name: category2,
            id: category2Id,
            children: {}
          };
        }
        
        // Add category3 if it exists
        if (category3Id && category3) {
          if (!categoryHierarchy[category1].children[category2].children[category3]) {
            categoryHierarchy[category1].children[category2].children[category3] = {
              name: category3,
              id: category3Id,
              children: {}
            };
          }
        }
      }
    });
    
    // Convert to array format for easier use in components
    const categoriesArray = Object.values(categoryHierarchy).map(cat1 => ({
      name: cat1.name,
      id: cat1.id,
      children: Object.values(cat1.children).map(cat2 => ({
        name: cat2.name,
        id: cat2.id,
        children: Object.values(cat2.children).map(cat3 => ({
          name: cat3.name,
          id: cat3.id,
          children: []
        }))
      }))
    }));
    
    // Save the hierarchical structure
    const outputPath = './src/data/categories.json';
    const outputDir = path.dirname(outputPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(categoriesArray, null, 2));
    
    console.log(`Categories parsed successfully!`);
    console.log(`Total top-level categories: ${categoriesArray.length}`);
    console.log(`Output saved to: ${outputPath}`);
    
    // Show summary
    categoriesArray.forEach(cat1 => {
      console.log(`${cat1.name} (${cat1.children.length} subcategories)`);
      cat1.children.forEach(cat2 => {
        if (cat2.children.length > 0) {
          console.log(`  └─ ${cat2.name} (${cat2.children.length} items)`);
        } else {
          console.log(`  └─ ${cat2.name}`);
        }
      });
    });
    
  } catch (error) {
    console.error('Error parsing categories:', error);
  }
}

parseCategories();
