const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

const graphql = require('graphql');
const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLSchema,
  GraphQLNonNull
} = graphql;

const OwnerType = new GraphQLObjectType({
  name: 'Owner',
  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    age: {type: GraphQLInt},
    pets: {
      type: PetType,
      resolve(parent, args){
        return database('owners')
          .join('pets', {'owner_id': parent.id})
          .first()
      }
    }
  })
});

const PetType = new GraphQLObjectType({
  name: 'Pet',
  //It is important that the fields is a function when we add our relationship later.
  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    animal_type: {type: GraphQLString},
    breed: {type: GraphQLString},
    age: {type: GraphQLInt},
    favorite_treat: {type: GraphQLString},
    owner: {
      type: OwnerType,
      resolve(parent, args){
        return database('pets')
          .join('owners', {'pets.owner_id': 'owners.id'})
          .where('owner.id', parent.owner_id)
          .first()
      }
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields:{
    pet: {
      type: PetType,
      args: {id: {type: GraphQLID}},
      resolve(parent, args){
        return database('pets').where('id', args.id).first()
      }
    },
    pets: {
      type: new GraphQLList(PetType),
      resolve(parent, args){
        return database('pets').select()
      }
    },
    owner: {
      type: OwnerType,
      args: {id: {type: GraphQLID}},
      resolve(parent, args){
        return database('owners').where('id', args.id).first()
      }
    },
    owners: {
      type: new GraphQLList(OwnerType),
      resolve(parent, args){
        return database('owners').select()
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addOwner: {
      type: OwnerType,
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        age: {type: GraphQLNonNull(GraphQLInt)}
      },
      resolve(parent, args){
        return database('owners')
        .returning('*')
        .insert({
          name: args.name,
          age: args.age
        })
        .then(result => result[0])
        .catch(error => error)
      }
    },
    deleteOwner: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve(parent, args){
        return database('owners')
        .where('id', args.id)
        .del()
        .then((result) => {
          if(result == 1){
            return "Success!"
          } else {
            return "Something went wrong, please check the id and try again."
          }
        })
        .catch(error => error)
      }
    },
    addPet: {
      type: PetType,
      args: {
                  name: {type: GraphQLNonNull(GraphQLString)},
                   age: {type: GraphQLNonNull(GraphQLInt)},
           animal_type: {type: GraphQLNonNull(GraphQLString)},
                 breed: {type: GraphQLNonNull(GraphQLString)},
        favorite_treat: {type: GraphQLNonNull(GraphQLString)},
              owner_id: {type: GraphQLNonNull(GraphQLInt)}
      },
      resolve(parent, args){
        return database('pets')
        .returning('*')
        .insert({
                    name: args.name,
                     age: args.age,
             animal_type: args.animal_type,
                   breed: args.breed,
          favorite_treat: args.favorite_treat,
                owner_id: args.owner_id
        })
        .then(result => result[0])
        .catch(error => error)
      }
    },
    deletePet: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve(parent, args){
        return database('pets')
        .where('id', args.id)
        .del()
        .then((result) => {
          if(result == 1){
            return "Success!"
          } else {
            return "Something went wrong, please check the id and try again."
          }
        })
        .catch(error => error)
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
})
