import { Injectable, ExecutionContext, CanActivate } from "@nestjs/common";
import { Observable } from 'rxjs';
import { User } from "../interfaces/user.interface";

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		
		const user: User = request.user;
		console.log('esto es user de AtuhGuard')
		console.log(user)
		console.log('esto es request.user de authguard')
		console.log(request.user)
		
		

		return !!user;
	}
}