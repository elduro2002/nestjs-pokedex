import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'


@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) { }

  async create(createPokemonDto: CreatePokemonDto) {

    try {

      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;

    } catch (error) {
      this.handleExeptions(error)
    }
  }

  async findAll() {
    return await this.pokemonModel.find()
  }

  async findOne(term: string) {


    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term });
      console.log(pokemon)
      // return pokemon;
    }


    // MongoID

    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term)
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLocaleLowerCase().trim() })
    }

    if (!pokemon) throw new NotFoundException(`The pokemon with id, name or no ${term} does not exist`)

    // return `This action returns a #${term} pokemon`;
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase()

    try {
      await pokemon.updateOne(updatePokemonDto);
      return { ...pokemon.toJSON(), ...updatePokemonDto }

    } catch (error) {
      this.handleExeptions(error)
    }
  }

  async remove(id: string) {

    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne()
    // const result = await this.pokemonModel.findByIdAndRemove(id);

    const { deletedCount, acknowledged } = await this.pokemonModel.deleteOne({ _id: id });

    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with ID ${ id } not found...`)
    }

    // return result;
  }

  private handleExeptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
    }

    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`)
  }
}
