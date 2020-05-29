import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entity/User";
import { hash, compare } from "bcryptjs";
import MyContext from "../types/MyContext";
import { isAuth } from "./middleware";
import {
  getRefreshToken,
  sendRefreshToken,
  getAccessToken,
} from "../util/auth";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@Resolver()
export default class {
  @Query(() => String)
  @UseMiddleware(isAuth)
  hello() {
    return "Hello, World!";
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    const hashedPassword = await hash(password, 12);
    try {
      await User.insert({
        email,
        password: hashedPassword,
      });
    } catch (err) {
      console.log(err);
      return false;
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error("could not find user");
    }

    const validPassword = await compare(password, user.password);

    if (!validPassword) {
      throw new Error("could not find user");
    }

    sendRefreshToken(res, getRefreshToken(user));

    return {
      accessToken: getAccessToken(user),
    };
  }
}
