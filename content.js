module.exports = {

    retrieve_parsed_content: function(items){
        arr_content = [];
        items.forEach(function(item){
          arr_content.push(item.name);
        })
        
        return arr_content;
    }
};