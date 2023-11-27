import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { AddWorkflowDocumentDto } from './dto/addWorkflowDocument.dto';
import { AddWorkflowSinCiDocumentDto } from './dto/addWorkflowSinCiDocument.dto';
import {
  Workflow,
  WorkflowDocuments,
} from 'src/workflow/schemas/workflow.schema';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import {
  EstadoUbiacion,
  EstadoUbiacionDocument,
} from 'src/estado-ubicacion/schema/estado-ubicacion.schema';

@Injectable()
export class SendDerivedDocumentsService {
  private readonly apiPersonalGetCi = getConfig().api_personal_get_ci;
  private readonly apiPersonalGet = getConfig().api_personal_get;
  private readonly apiOrganizationChartMain =
    getConfig().api_organization_chart_main;
  private readonly apiOrganizationChartId =
    getConfig().api_organization_chart_id;
  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    @InjectModel(Workflow.name)
    private readonly workflowModel: Model<WorkflowDocuments>,
    private readonly httpService: HttpService,
    @InjectModel(EstadoUbiacion.name)
    private readonly estadoUbicacionModel: Model<EstadoUbiacionDocument>,
  ) {}

  //Funcion para enviar documentos a todo el personal
  //dentro de la primera unidad del workflow
  async sendDocumentToUnity(
    documentId: string,
    addWorkflowWithoutCiDocumentDto: AddWorkflowSinCiDocumentDto,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    const { workflowName } = addWorkflowWithoutCiDocumentDto;
    if (document.stateDocumentUserSend === 'OBSERVADO') {
      if (workflowName === document.workflow.nombre) {
        const documentSend = await this.sendDocumentWithoutCi(
          documentId,
          workflowName,
          userId,
        );
        return documentSend;
      } else {
        throw new HttpException(
          'El documento debe enviarse al mismo flujo de trabajo',
          400,
        );
      }
    } else {
      if (document.stateDocumentUserSend === 'INICIADO') {
        throw new HttpException(`El documento ya fue enviado`, 400);
      }
      const documentSend = await this.sendDocumentWithoutCi(
        documentId,
        workflowName,
        userId,
      );
      return documentSend;
    }
  }

  //aplicado estado ubicacion
  async sendDocumentWithCi(
    documentId: string,
    addWorkflowDocumentDto: AddWorkflowDocumentDto,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    const { worflowName, ci } = addWorkflowDocumentDto;
    if (!ci) {
      throw new HttpException(`No se encontro ci`, 400);
    }
    await this.validateCi(ci);
    if (document.stateDocumentUserSend === 'OBSERVADO') {
      if (worflowName === document.workflow.nombre) {
        const documentSend = await this.sendDocument(
          documentId,
          worflowName,
          ci,
          userId,
        );
        return documentSend;
      } else {
        throw new HttpException(
          `El documento debe enviarse al mismo flujo de trabajo`,
          400,
        );
      }
    } else {
      if (document.stateDocumentUserSend === 'INICIADO') {
        throw new HttpException(`El documento ya fue enviado`, 400);
      }
      const documentSend = await this.sendDocument(
        documentId,
        worflowName,
        ci,
        userId,
      );
      return documentSend;
    }
  }

  //estado-ubicacion colocado
  async derivarDocumentAll(
    documentId: string,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    await this.validarDerivacion(document, userId);
    // verificar el estado del siguiente paso
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = document.workflow.pasos;

    const findMarkDocuments = document.userReceivedDocument.some((entry) => {
      return entry.idOfUser === userId;
    });
    if (!findMarkDocuments) {
      throw new HttpException(`Usted no puede derivar el documento`, 400);
    }

    //------- obtener lista con todos los usuarios ---
    //---------
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;

    // verificar la oficina actual de usuario lodgeado
    const oficinaActualUsuario = userOficce;
    const oficinaUserDentroBitacora = document.workflow.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );
    const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const personalList = await this.httpService
      .get(`${this.apiPersonalGet}`)
      .toPromise();
    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      name: user.name,
      lastName: user.lastName,
      ci: user.ci,
      idOfUser: user._id,
    }));
    const filteredUnitysPersonal = unitysPersonalAll.filter(
      (user) => user.ci !== loggedUser.data.ci,
    );
    const obtainDatos = await Promise.all(
      filteredUnitysPersonal.map(async (idOfice) => ({
        info: await this.httpService
          .get(
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              idOfice.unity,
            )}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
        name: idOfice.name,
        lastName: idOfice.lastName,
      })),
    );
    if (pasoActual < pasos.length) {
      if (nextPasoUserState.completado === true) {
        throw new HttpException(
          'usted ya no puede derivar el documento porque ya fue enviado',
          400,
        );
      }
      const reeeee = obtainDatos.map((response) => ({
        nameUnity: response.info.data[0].name,
        idOficce: response.info.data[0]._id,
        idOfUser: response.idOfUser,
        ci: response.ci,
        name: response.name,
        lastName: response.lastName,
      }));
      const matchingUsers = reeeee.filter(
        (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      );
      const receivedUsers = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        nameOfficeUserRecieved: data.nameUnity,
        name: data.name,
        lastName: data.lastName,
        dateRecived: new Date(),
        observado: false,
        stateDocumentUser: 'RECIBIDO',
      }));
      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.pasos[pasoActual].oficina;

        const nameOfTheOffice = await this.httpService
          .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        document.bitacoraWorkflow.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          userSend: document.userId,
          dateSend: document.bitacoraWorkflow[0].dateSend,
          userDerived: userId,
          datedDerived: new Date(),
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos.map((paso) => ({
            paso: paso.paso,
            idOffice: paso.idOffice,
            oficina: paso.oficina,
            completado: paso.completado,
          })),
        });

        // Cambiar el estado del documento a 'DERIVADO' en receivedUsers
        document.bitacoraWorkflow[
          document.bitacoraWorkflow.length - 1
        ].receivedUsers
          .filter((user) => user.idOfUser === userId)
          .forEach((user) => (user.stateDocumentUser = 'DERIVADO'));

        //--poner valor del siguiente oficina
        for (let i = 0; i < pasos.length; i++) {
          const paso = pasos[i];
          if (!paso.completado) {
            document.oficinaPorPasar = paso.oficina;
          } else {
            document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
          }
        }

        const findEstadoUbicacion = await this.estadoUbicacionModel
          .findOne({ idDocument: documentId })
          .exec();

        findEstadoUbicacion.estado_ubi.map((entry) => {
          return (entry.activo = false);
        });
        await findEstadoUbicacion.save();

        findEstadoUbicacion.estado_ubi.push({
          nameOffices: `${pasos[pasoActual].oficina}`,
          stateOffice: 'DERIVADO',
          numberPasoOffice: pasoActual,
          receivedUsers: findEstadoUbicacion.estado_ubi
            .filter((entry) => entry.numberPasoOffice === pasoActual)
            .flatMap((item) => item.receivedUsers),
          activo: false,
        });

        findEstadoUbicacion.estado_ubi.push({
          nameOffices: `${nameOffce}`,
          stateOffice: 'RECIBIDO',
          numberPasoOffice: pasoActual + 1,
          receivedUsers: receivedUsers,
          activo: true,
        });

        await findEstadoUbicacion.save();
        document.estado_Ubicacion = findEstadoUbicacion;

        document.oficinaActual = workflow.oficinaActual;

        document.userReceivedDocument = receivedUsers;
        document.workflow = workflow;
        // document.stateDocumetUser = 'DERIVADO';
        document.stateDocumentUserSend = 'INICIADO';
      }
      await document.save();
      return document;
    } else {
      throw new HttpException('no hay a quien mas derivar', 400);
    }
  }

  //estado ubicacion puesto
  async derivarDocumentWithCi(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);
    await this.validarDerivacion(document, userId);

    await this.validateCi(ci);

    const findMarkDocuments = document.userReceivedDocument.some((entry) => {
      return entry.idOfUser === userId;
    });
    if (!findMarkDocuments) {
      throw new HttpException(`Usted no puede derivar el documento`, 400);
    }

    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.pasos;
    const oficinaUserDentroBitacora = document.workflow.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );
    const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    if (pasoActual < pasos.length) {
      if (nextPasoUserState.completado === true) {
        throw new HttpException(
          'usted ya no puede derivar el documento porque ya fue enviado',
          400,
        );
      }
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${this.apiPersonalGetCi}/${ci}`)
          .toPromise();
        if (user.data._id === userId) {
          throw new HttpException('No se puede enviar archivo a si mismo', 400);
        }
        if (!user.data) {
          throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
        }
        const unityUser = user.data.unity;
        const dataOficeUser = await this.httpService
          .get(
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              unityUser,
            )}`,
          )
          .toPromise();
        const exacMatch = dataOficeUser.data.find(
          (result) => result.name === unityUser,
        );

        const idOfficeUser = exacMatch._id;
        if (pasos[pasoActual].idOffice !== idOfficeUser) {
          throw new HttpException(
            `Usuario con CI: ${ci} no trabaja en la oficina a enviar`,
            400,
          );
        }
        return {
          ci,
          idOfUser: user.data._id,
          name: user.data.name,
          lastName: user.data.lastName,
          idOfficeUser,
          unityUser,
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.pasos[pasoActual].oficina;

      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;

      document.bitacoraWorkflow.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
          name: user.name,
          lastName: user.lastName,
          dateRecived: new Date(),
          observado: false,
          stateDocumentUser: 'RECIBIDO',
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });

      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'DERIVADO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      const newUserRecievedDocument = unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        name: user.name,
        lastName: user.lastName,
        nameOfficeUserRecieved: user.unityUser,
        dateRecived: new Date(),
        nameUser: user.name,
        observado: false,
        stateDocumentUser: 'RECIBIDO',
      }));

      //--poner valor del siguiente oficina
      for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];
        if (!paso.completado) {
          document.oficinaPorPasar = paso.oficina;
        } else {
          document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
        }
      }

      const findEstadoUbicacion = await this.estadoUbicacionModel
        .findOne({ idDocument: documentId })
        .exec();

      findEstadoUbicacion.estado_ubi.map((entry) => {
        return (entry.activo = false);
      });
      await findEstadoUbicacion.save();

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${pasos[pasoActual - 1].oficina}`,
        stateOffice: 'DERIVADO',
        numberPasoOffice: pasoActual,
        receivedUsers: findEstadoUbicacion.estado_ubi
          .filter((entry) => entry.numberPasoOffice === pasoActual)
          .flatMap((item) => item.receivedUsers),
        activo: false,
      });

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${nameOffce}`,
        stateOffice: 'RECIBIDO',
        numberPasoOffice: pasoActual + 1,
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          nameOfficeUserRecieved: user.unityUser,
          name: user.name,
          lastName: user.lastName,
          dateRecived: new Date(),
          observado: false,
          stateDocumentUser: 'RECIBIDO',
        })),
        activo: true,
      });

      await findEstadoUbicacion.save();

      document.estado_Ubicacion = findEstadoUbicacion;

      document.oficinaActual = workflow.oficinaActual;

      document.userReceivedDocument = newUserRecievedDocument;
      document.bitacoraWorkflow = updateBitacoraWorkflow;
      document.workflow = workflow;
      // document.stateDocumetUser = 'DERIVADO';
      document.stateDocumentUserSend = 'INICIADO';
      await document.save();
      return document;
    } else {
      throw new HttpException('no hay a quien mas derivar', 400);
    }
  }

  //estado ubicacion puesto
  async sendDocumentSinWorkflow(
    documentId: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);
    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }
    await this.validateCi(ci);

    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const unityUserPromises = ci.map(async (ci) => {
      const user = await this.httpService
        .get(`${this.apiPersonalGetCi}/${ci}`)
        .toPromise();
      if (user.data._id === userId) {
        throw new HttpException(
          'No se puede enviar un documento a si mismo',
          400,
        );
      }
      if (!user) {
        throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
      }

      const unityUser = user.data.unity;
      const dataOficeUser = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
            unityUser,
          )}`,
        )
        .toPromise();
      const exacMatchToUsers = loggedUserOffice.data.find(
        (result) => result.name === userOficce,
      );
      const idOfficeUser = exacMatchToUsers._id;
      return {
        ci,
        idOfUser: user.data._id,
        name: user.data.name,
        lastName: user.data.lastName,
        idOfficeUser,
        unityUser,
      };
    });

    const unityUsers = await Promise.all(unityUserPromises);

    let infoIdUsers = document.bitacoraWithoutWorkflow.map((data) =>
      data.recievedUsers.map((data) => data.idOfUser),
    );

    const idUsersToSend = unityUsers.map((data) => data.idOfUser);

    document.bitacoraWithoutWorkflow.push({
      idUserSendOrigin: userId,
      idOfficeUserSend: exacMatch._id,
      nameOficeUser: userOficce,
      recievedUsers: unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        idOffice: user.idOfficeUser,
        name: user.name,
        lastName: user.lastName,
        nameOficeUserRecieved: user.unityUser,
        stateDocumentUser: 'RECIBIDO DIRECTO',
      })),
    });
    const userReceivedDocument = unityUsers.map((user) => ({
      ciUser: user.ci,
      idOfUser: user.idOfUser,
      name: user.name,
      lastName: user.lastName,
      nameOfficeUserRecieved: user.unityUser,
      dateRecived: new Date(),
      stateDocumentUser: 'RECIBIDO DIRECTO',
      nameUser: user.name,
      observado: false,
    }));

    // document.estado_Ubicacion.push({
    //   oficina:
    // })

    // document.userReceivedDocumentWithoutWorkflow =
    //   userReceivedDocumentWithoutWorkflow;
    document.userReceivedDocument = userReceivedDocument;
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';
    document.bitacoraWithoutWorkflow.find((entry) => {
      entry.recievedUsers.find((entry) => {
        if (entry.idOfUser === userId) {
          return (entry.stateDocumentUser = 'ENVIADO DIRECTO');
        }
      });
    });

    const findEstadoUbicacion = await this.estadoUbicacionModel
      .findOne({ idDocument: documentId })
      .exec();

    findEstadoUbicacion.estado_ubi.map((entry) => {
      return (entry.activo = false);
    });

    findEstadoUbicacion.save();

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${userOficce}`,
      stateOffice: 'ENVIADO',
      numberPasoOffice: null,
      receivedUsers: [
        {
          ciUser: loggedUser.data.ci,
          idOfUser: userId,
          name: loggedUser.data.name,
          lastName: loggedUser.data.lastName,
          nameOfficeUserRecieved: null,
          dateRecived: null,
          // nameUser: loggedUser.data.name,
          stateDocumentUser: 'ENVIADO',
          observado: false,
        },
      ],
      activo: false,
    });

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${userOficce}`,
      stateOffice: 'RECIBIDO DIRECTO',
      numberPasoOffice: null,
      receivedUsers: unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        name: user.name,
        lastName: user.lastName,
        nameOfficeUserRecieved: user.unityUser,
        dateRecived: new Date(),
        nameUser: user.name,
        stateDocumentUser: 'RECIBIDO DIRECTO',
        observado: false,
      })),
      activo: true,
    });
    await findEstadoUbicacion.save();
    document.estado_Ubicacion = findEstadoUbicacion;
    await document.save();
    return document;
  }

  //estado ubicacion colocado
  async sendDocumentMultiUnitysWithoutWorkflow(
    documentId: string,
    unitys: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(documentId);

    if (document.workflow) {
      throw new HttpException(
        'este documento cuenta con un flujo de trabajo',
        400,
      );
    }

    // Verificar la oficina actual del usuario logeado
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOffice = loggedUser.data.unity;

    // Obtener información de las oficinas a las que se enviará el documento
    const officeInfoPromises = unitys.map(async (unity) => {
      const response = await this.httpService
        .get(
          `${this.apiOrganizationChartMain}?name=${encodeURIComponent(unity)}`,
        )
        .toPromise();
      // console.log(response.data);
      return {
        idOfficeUserSend: userOffice,
        nameOficeUserSend: userOffice,
        idUserSend: userId,
        send: [
          {
            nameUnity: unity,
            idUnity: response.data[0]?._id || '',
            receivedUsers: [],
          },
        ],
      };
    });

    const officeInfoList = await Promise.all(officeInfoPromises);

    // Obtener información de los usuarios de las unidades a las que se enviará el documento
    const usersToNotifyPromises = unitys.map(async (unity) => {
      // Realizar una llamada al servicio externo para obtener la `idUnity` de cada usuario
      const usersResponse = await this.httpService
        .get(`${this.apiPersonalGet}?unity=${unity}`)
        .toPromise();

      // Obtener la `idUnity` de cada usuario
      const users = usersResponse.data;
      const unityIdsPromises = users.map(async (user: any) => {
        // Realizar una llamada al servicio externo para obtener la `idUnity` de cada usuario
        const unityResponse = await this.httpService
          .get(`${this.apiOrganizationChartMain}?unity=${user.unity}`)
          .toPromise();
        const exacMatch = unityResponse.data.find(
          (result) => result.name === user.unity,
        );
        const idOfficeUser = exacMatch ? exacMatch._id : '';
        console.log(idOfficeUser);
        return idOfficeUser;
      });

      const unityIds = await Promise.all(unityIdsPromises);
      // console.log('esto es unityIds');
      // console.log(unityIds);

      return { users, unityIds };
    });

    const usersToNotifyLists = await Promise.all(usersToNotifyPromises);

    // Crear una entrada en la estructura sendMultiUnitysWithoutWorkflow para cada usuario
    usersToNotifyLists.forEach((usersInfo, index) => {
      const officeInfo = officeInfoList[index];
      usersInfo.users.forEach((user: any, userIndex: number) => {
        const unityId = usersInfo.unityIds[userIndex];
        if (unityId === officeInfo.send[0].idUnity) {
          // Comparar la `idUnity` obtenida
          officeInfo.send[0].receivedUsers.push({
            ciUser: user.ci,
            idOfUser: user._id,
          });
        }
      });
    });

    // Agregar la estructura sendMultiUnitysWithoutWorkflow al documento
    if (!document.sendMultiUnitysWithoutWorkflow) {
      document.sendMultiUnitysWithoutWorkflow = [];
    }
    document.sendMultiUnitysWithoutWorkflow.push(...officeInfoList);

    // Actualizar el estado del documento
    // document.stateDocumetUser = 'ENVIADO DIRECTO';
    document.stateDocumentUserSend = 'ENVIADO DIRECTO';

    // Obtén los nombres de las unidades
    const unityNames = officeInfoList.map(
      (officeInfo) => officeInfo.send[0].nameUnity,
    );

    const findEstadoUbicacion = await this.estadoUbicacionModel
      .findOne({ idDocument: documentId })
      .exec();

    findEstadoUbicacion.estado_ubi.map((entry) => {
      return (entry.activo = false);
    });
    await findEstadoUbicacion.save();

    const usersFromSendMultiUnity = [];

    document.sendMultiUnitysWithoutWorkflow.forEach((sendInfo) => {
      // Iterar a través de la propiedad 'send' de sendMultiUnity
      sendInfo.send.forEach((unityInfo) => {
        unityInfo.receivedUsers.forEach((user) => {
          usersFromSendMultiUnity.push(user);
        });
      });
    });

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${userOffice}`,
      stateOffice: 'ENVIADO DIRECTO',
      numberPasoOffice: null,
      receivedUsers: usersFromSendMultiUnity,
      activo: false,
    });

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${userOffice}`,
      stateOffice: 'RECIBIDO',
      numberPasoOffice: null,
      receivedUsers: usersFromSendMultiUnity,
      activo: true,
    });
    await findEstadoUbicacion.save();
    document.estado_Ubicacion = findEstadoUbicacion;

    await document.save();
    return document;
  }

  //-------------------------------------------------------
  private async checkDocument(id: string) {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new HttpException(`El documento no fue encontrado`, 404);
    }
    if (document.active === false) {
      throw new HttpException('El documento fue archivado o eliminado', 400);
    }
    return document;
  }

  private async validateCi(ci: string[]) {
    const uniqueCi = new Set(ci);
    if (uniqueCi.size !== ci.length) {
      throw new HttpException(
        'Hay números de identificación CI duplicados',
        400,
      );
    }
  }

  async findWorkflowByName(workflowName: string) {
    const workflowData = await this.workflowModel
      .findOne({ nombre: workflowName })
      .exec();
    if (!workflowData) {
      throw new HttpException('No se encontro nombre del worflow', 404);
    }
    if (workflowData.activeWorkflow === false) {
      throw new HttpException('El workflow puesto está inactivo', 400);
    }
    return workflowData;
  }

  //estado ubicacion colocado
  private async sendDocument(
    id: string,
    workflowName: string,
    ci: string[],
    userId: string,
  ) {
    const document = await this.checkDocument(id);

    const workflowData = await this.findWorkflowByName(workflowName);

    const workDt = {
      nombre: workflowData.nombre,
      descriptionWorkflow: workflowData.descriptionWorkflow,
      pasos: workflowData.pasos,
      idStep: workflowData.idStep,
      pasoActual: workflowData.pasoActual,
      createdAt: workflowData.createdAt,
      activeWorkflow: workflowData.activeWorkflow,
      oficinaActual: workflowData.oficinaActual,
      updateAt: workflowData.updateAt,
    };

    document.workflow = workDt;
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.pasos;
    if (pasoActual < pasos.length) {
      const unityUserPromises = ci.map(async (ci) => {
        const user = await this.httpService
          .get(`${this.apiPersonalGetCi}/${ci}`)
          .toPromise();
        if (user.data._id === userId) {
          throw new HttpException('No se puede enviar archivo a si mismo', 400);
        }
        if (!user.data) {
          throw new HttpException(`Usuario con CI: ${ci} no encontrado`, 404);
        }
        const unityUser = user.data.unity;
        const dataOficeUser = await this.httpService
          .get(
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              unityUser,
            )}`,
          )
          .toPromise();
        const exacMatch = dataOficeUser.data.find(
          (result) => result.name === unityUser,
        );
        const idOfficeUser = exacMatch._id;
        if (pasos[pasoActual].idOffice !== idOfficeUser) {
          throw new HttpException(
            `Usuario con CI: ${ci} no trabaja en la oficina a enviar`,
            400,
          );
        }
        return {
          ci,
          idOfUser: user.data._id,
          name: user.data.name,
          lastName: user.data.lastName,
          idOfficeUser,
          unityUser,
        };
      });
      const unityUsers = await Promise.all(unityUserPromises);
      pasos[pasoActual].completado = true;
      workflow.pasoActual = pasoActual + 1;
      workflow.oficinaActual = workflow.pasos[pasoActual].oficina;
      let newBitacora = [];
      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;
      newBitacora.push({
        oficinaActual: pasos[pasoActual].idOffice,
        nameOficinaActual: nameOffce,
        userSend: userId,
        dateSend: new Date(),
        userDerived: '',
        datedDerived: '',
        receivedUsers: unityUsers.map((user) => ({
          ciUser: user.ci,
          idOfUser: user.idOfUser,
          name: user.name,
          lastName: user.lastName,
          nameOfficeUserRecieved: user.unityUser,
          dateRecived: new Date(),
          nameUser: user.name,
          stateDocumentUser: 'RECIBIDO',
        })),
        motivoBack: 'se envio documento a personal seleccionado',
        oficinasPorPasar: pasos,
      });

      const receivedDocumentUsers = unityUsers.map((user) => ({
        ciUser: user.ci,
        idOfUser: user.idOfUser,
        name: user.name,
        lastName: user.lastName,
        nameOfficeUserRecieved: user.unityUser,
        dateRecived: new Date(),
        nameUser: user.name,
        stateDocumentUser: 'RECIBIDO',
        observado: false,
      }));

      //--poner valor del siguiente oficina
      for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];
        if (!paso.completado) {
          document.oficinaPorPasar = paso.oficina;
        } else {
          document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
        }
      }

      const findEstadoUbicacion = await this.estadoUbicacionModel
        .findOne({ idDocument: id })
        .exec();

      const getInfoPersonal = await this.httpService
        .get(`${this.apiPersonalGet}/${userId}`)
        .toPromise();

      findEstadoUbicacion.estado_ubi.map((entry) => {
        return (entry.activo = false);
      });
      await findEstadoUbicacion.save();

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${getInfoPersonal.data.unity}`,
        stateOffice: 'ENVIADO',
        numberPasoOffice: null,
        receivedUsers: receivedDocumentUsers,
        activo: false,
      });

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${workflow.oficinaActual}`,
        stateOffice: 'RECBIDO',
        numberPasoOffice: pasoActual + 1,
        receivedUsers: receivedDocumentUsers,
        activo: true,
      });

      await findEstadoUbicacion.save();
      document.estado_Ubicacion = findEstadoUbicacion;

      document.oficinaActual = workflow.oficinaActual;
      document.userReceivedDocument = receivedDocumentUsers;
      document.workflow = workflow;
      document.stateDocumentUserSend = 'INICIADO';
      // document.stateDocumetUser = '';
      document.bitacoraWorkflow = newBitacora;
      await document.save();
      return document;
    } else {
      document.stateDocumentUserSend = 'CONCLUIDO';
      await document.save();
      return document;
    }
  }

  //estado ubicacion colocado
  private async sendDocumentWithoutCi(
    id: string,
    workflowName: string,
    userId: string,
  ) {
    const document = await this.checkDocument(id);
    const workflowData = await this.findWorkflowByName(workflowName);
    if (!workflowData) {
      throw new HttpException('no se encontro el workflow', 400);
    }
    const {
      descriptionWorkflow,
      pasos,
      idStep,
      createdAt,
      activeWorkflow,
      oficinaActual,
      updateAt,
      nombre,
    } = workflowData;

    const workDt: Workflow = {
      nombre: workflowData.nombre,
      descriptionWorkflow,
      pasos,
      idStep,
      pasoActual: workflowData.pasoActual,
      createdAt,
      activeWorkflow,
      oficinaActual,
      updateAt,
    };

    document.workflow = workDt;

    //---------paso actual del documento ---
    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    // const pasos = workflow.pasos;

    //------- obtener lista con todos los usuarios ---
    //---- obtener info de la persona logeada y evitar su registro si trabja en
    //---- misma oficina
    const loggedUser = await this.httpService
      .get(`${this.apiPersonalGet}/${userId}`)
      .toPromise();
    const userOficce = loggedUser.data.unity;
    const oficinaUserDentroBitacora = document.workflow.pasos.filter(
      (dat) => dat.oficina === userOficce,
    );

    // const nextPasoUserState = pasos[oficinaUserDentroBitacora[0].paso];
    const loggedUserOffice = await this.httpService
      .get(
        `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
          userOficce,
        )}`,
      )
      .toPromise();
    const exacMatch = loggedUserOffice.data.find(
      (result) => result.name === userOficce,
    );

    const personalList = await this.httpService
      .get(`${this.apiPersonalGet}`)
      .toPromise();

    const personalListData = personalList.data;
    const unitysPersonalAll = personalListData.map((user) => ({
      unity: user.unity,
      ci: user.ci,
      idOfUser: user._id,
      name: user.name,
    }));

    // Filtrar la lista de usuarios de la oficina actual para excluir al usuario logueado
    const filteredUnitysPersonal = unitysPersonalAll.filter(
      (user) => user.ci !== loggedUser.data.ci,
    );

    const obtainDatos = await Promise.all(
      filteredUnitysPersonal.map(async (idOfice) => ({
        info: await this.httpService
          .get(
            `${this.apiOrganizationChartMain}?name=${encodeURIComponent(
              idOfice.unity,
            )}`,
          )
          .toPromise(),
        idOfUser: idOfice.idOfUser,
        ci: idOfice.ci,
        name: idOfice.name,
      })),
    );

    if (pasoActual < pasos.length) {
      // if (nextPasoUserState.completado === true) {
      //   throw new HttpException(
      //     'usted ya no puede derivar el documento porque ya fue derivado de su oficina',
      //     400,
      //   );
      // }

      const reeeee = obtainDatos.map((response) => ({
        nameUnity: response.info.data[0].name,
        idOficce: response.info.data[0]._id,
        idOfUser: response.idOfUser,
        name: response.name,
        lastName: response.lastName,
        ci: response.ci,
      }));

      const matchingUsers = reeeee.filter(
        (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      );
      // const matchingUsers = filteredUnitysPersonal.filter(
      //   (datata) => datata.idOficce === pasos[pasoActual].idOffice,
      // );

      const receivedUsers = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        name: data.name,
        lastName: data.lastName,
        nameOfficeUserRecieved: data.nameUnity,
        dateRecived: new Date(),
        stateDocumentUser: 'RECIBIDO',
      }));

      const userReceivedDocument = matchingUsers.map((data) => ({
        ciUser: data.ci,
        idOfUser: data.idOfUser,
        name: data.name,
        lastName: data.lastName,
        nameOfficeUserRecieved: data.nameUnity,
        dateRecived: new Date(),
        nameUser: data.name,
        stateDocumentUser: 'RECIBIDO',
        observado: false,
      }));

      if (matchingUsers.length > 0) {
        pasos[pasoActual].completado = true;
        workflow.pasoActual = pasoActual + 1;
        workflow.oficinaActual = workflow.pasos[pasoActual].oficina;
        const nameOfTheOffice = await this.httpService
          .get(`${this.apiOrganizationChartId}/${pasos[pasoActual].idOffice}`)
          .toPromise();
        const nameOffce = nameOfTheOffice.data.name;

        let newBitacora = [];
        newBitacora.push({
          oficinaActual: pasos[pasoActual].idOffice,
          nameOficinaActual: nameOffce,
          userSend: userId,
          dateSend: new Date(),
          userDerived: '',
          datedDerived: '',
          receivedUsers: receivedUsers,
          motivoBack: 'Se envio documento a todo el personal de la unidad',
          oficinasPorPasar: pasos,
        });

        //--poner valor del siguiente oficina
        for (let i = 0; i < pasos.length; i++) {
          const paso = pasos[i];
          if (!paso.completado) {
            document.oficinaPorPasar = paso.oficina;
          } else {
            document.oficinaPorPasar = 'NO HAY OFICINA POR PASAR';
          }
        }

        const findEstadoUbicacion = await this.estadoUbicacionModel
          .findOne({ idDocument: id })
          .exec();

        findEstadoUbicacion.estado_ubi.map((entry) => {
          return (entry.activo = false);
        });
        findEstadoUbicacion.save();

        findEstadoUbicacion.estado_ubi.push({
          nameOffices: `${userOficce}`,
          stateOffice: 'ENVIADO',
          numberPasoOffice: null,
          receivedUsers: userReceivedDocument,
          activo: false,
        });

        findEstadoUbicacion.estado_ubi.push({
          nameOffices: `${nameOffce}`,
          stateOffice: 'RECIBIDO',
          numberPasoOffice: pasoActual + 1,
          receivedUsers: userReceivedDocument,
          activo: true,
        });

        // const newEstadoUbicacion = findEstadoUbicacion.push({
        //   idDocument: id,
        //   nameOffice: userOficce,
        //   stateOffice: 'ENVIADO',
        //   receivedUsers: userReceivedDocument,
        //   activo: false
        // })
        await findEstadoUbicacion.save();
        document.estado_Ubicacion = findEstadoUbicacion;
        document.oficinaActual = workflow.oficinaActual;
        document.userReceivedDocument = userReceivedDocument;
        document.workflow = workflow;
        document.stateDocumentUserSend = 'INICIADO';
        document.bitacoraWorkflow = newBitacora;
      }
      await document.save();
      return document;
    } else {
      document.stateDocumentUserSend = 'CONCLUIDO';
      await document.save();
      return document;
      // throw new HttpException('se llego la paso final', 400);
    }
  }

  //devolver un documento, observarlo
  async selectPreviousStep(
    documentId: string,
    numberPaso: number,
    motive: string,
    userId: string,
  ): Promise<Documents> {
    const document = await this.checkDocument(documentId);
    if (document.workflow === null) {
      throw new HttpException(
        'no puedes devolver un documento que no inicio un flujo de trabajo',
        400,
      );
    }

    const workflow = document.workflow;
    const pasoActual = workflow.pasoActual;
    const pasos = workflow.pasos;

    if (
      numberPaso < 0 ||
      numberPaso > pasos.length ||
      numberPaso == pasoActual
    ) {
      throw new BadRequestException(
        'El paso no existe o es el mismo lugar en el que se encuentra el documento',
      );
    }

    if (numberPaso == 0 && pasoActual == 1) {
      const originalUserSend = document.userId;
      const infoOriginalUserSend = await this.httpService
        .get(`${this.apiPersonalGet}/${originalUserSend}`)
        .toPromise();
      document.bitacoraWorkflow.push({
        oficinaActual: 'remitente original',
        nameOficinaActual: 'remitente original',
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        receivedUsers: [
          {
            ciUser: '',
            idOfUser: originalUserSend,
            name: infoOriginalUserSend.data.name,
            lastName: infoOriginalUserSend.data.lastName,
            nameOfficeUserRecieved: '',
            dateRecived: new Date(),
            observado: true,
            // nameUser: infoOriginalUserSend.data.name,
            stateDocumentUser: 'OBSERVADO',
          },
        ],
        oficinasPorPasar: [],
        motivoBack: motive,
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });
      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      document.userReceivedDocument = [
        {
          ciUser: infoOriginalUserSend.data.ci,
          idOfUser: originalUserSend,
          name: infoOriginalUserSend.data.name,
          lastName: infoOriginalUserSend.data.lastName,
          nameOfficeUserRecieved: infoOriginalUserSend.data.unity,
          dateRecived: new Date(),
          stateDocumentUser: 'OBSERVADO',
          observado: true,
        },
      ];

      document.bitacoraWorkflow = updateBitacoraWorkflow;
      document.stateDocumentUserSend = 'OBSERVADO';
      const paso1 = pasos.find((paso) => paso.paso === 1);
      if (paso1) {
        paso1.completado = false;
      }

      const findEstadoUbicacion = await this.estadoUbicacionModel
        .findOne({ idDocument: documentId })
        .exec();

      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO
      //-----VER FUNCIONAMIENTO

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${document.oficinaActual}`,
        stateOffice: 'OBSERVADO Y DEVUELTO',
        numberPasoOffice: pasoActual + 1,
        receivedUsers: document.userReceivedDocument,
        activo: false,
      });

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${infoOriginalUserSend.data.unity}`,
        stateOffice: 'OBSERVADO',
        numberPasoOffice: 0,
        receivedUsers: document.userReceivedDocument,
        activo: true,
      });

      await findEstadoUbicacion.save();
      document.estado_Ubicacion = findEstadoUbicacion;

      await document.save();
      return document;
    }

    if (numberPaso == 0) {
      const originalUserSend = document.userId;
      const infoOriginalUserSend = await this.httpService
        .get(`${this.apiPersonalGet}/${originalUserSend}`)
        .toPromise();
      document.bitacoraWorkflow.push({
        oficinaActual: 'remitente original',
        nameOficinaActual: 'remitente original',
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        receivedUsers: [
          {
            ciUser: infoOriginalUserSend.data.ci,
            idOfUser: originalUserSend,
            name: infoOriginalUserSend.data.name,
            lastName: infoOriginalUserSend.data.lastName,
            nameOfficeUserRecieved: infoOriginalUserSend.data.unity,
            dateRecived: new Date(),
            observado: true,
            stateDocumentUser: 'OBSERVADO',
          },
        ],
        oficinasPorPasar: [],
        motivoBack: motive,
      });

      const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
        return entry.receivedUsers.some((user) => user.idOfUser === userId);
      });
      const updateBitacoraEntry = {
        ...bitacoraEntry,
        receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
          if (user.idOfUser === userId) {
            user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
          }
          return user;
        }),
      };
      const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
        return entry === bitacoraEntry ? updateBitacoraEntry : entry;
      });

      document.userReceivedDocument = [
        {
          ciUser: infoOriginalUserSend.data.ci,
          idOfUser: originalUserSend,
          name: infoOriginalUserSend.data.name,
          lastName: infoOriginalUserSend.data.lastName,
          nameOfficeUserRecieved: infoOriginalUserSend.data.unity,
          dateRecived: new Date(),
          stateDocumentUser: 'OBSERVADO',
          observado: true,
        },
      ];

      document.bitacoraWorkflow = updateBitacoraWorkflow;
      document.stateDocumentUserSend = 'OBSERVADO';
      const paso1 = pasos.find((paso) => paso.paso === 1);
      if (paso1) {
        paso1.completado = false;
      }
      const findEstadoUbicacion = await this.estadoUbicacionModel
        .findOne({ idDocument: documentId })
        .exec();

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${document.oficinaActual}`,
        stateOffice: 'OBSERVADO Y DEVUELTO',
        numberPasoOffice: pasoActual + 1,
        receivedUsers: document.userReceivedDocument,
        activo: false,
      });

      findEstadoUbicacion.estado_ubi.push({
        nameOffices: `${infoOriginalUserSend.data.unity}`,
        stateOffice: 'OBSERVADO',
        numberPasoOffice: 0,
        receivedUsers: document.userReceivedDocument,
        activo: true,
      });

      await findEstadoUbicacion.save();
      document.estado_Ubicacion = findEstadoUbicacion;
      await document.save();
      return document;
    }

    const selectedPaso = pasos[numberPaso - 1];
    if (numberPaso === document.workflow.pasoActual) {
      throw new HttpException(
        'usted se encuentra en el paso actual al cual desea reenviar',
        400,
      );
    }

    for (let i = numberPaso; i < pasos.length; i++) {
      pasos[i].completado = false;
    }

    workflow.pasoActual = numberPaso;
    workflow.oficinaActual = selectedPaso.idOffice;

    const matchingEntry = document.bitacoraWorkflow.find(
      (entry) => entry.oficinaActual === selectedPaso.idOffice,
    );

    if (matchingEntry) {
      const receivedUsers = matchingEntry.receivedUsers;

      receivedUsers.forEach((user) => {
        user.observado = true;
        user.stateDocumentUser = 'OBSERVADO';
      });

      const nameOfTheOffice = await this.httpService
        .get(`${this.apiOrganizationChartId}/${selectedPaso.idOffice}`)
        .toPromise();
      const nameOffce = nameOfTheOffice.data.name;

      document.bitacoraWorkflow.push({
        oficinaActual: selectedPaso.idOffice,
        nameOficinaActual: nameOffce,
        receivedUsers,
        userSend: document.userId,
        dateSend: document.bitacoraWorkflow[0].dateSend,
        userDerived: userId,
        datedDerived: new Date(),
        motivoBack: motive,
        oficinasPorPasar: pasos.map((paso) => ({
          paso: paso.paso,
          idOffice: paso.idOffice,
          oficina: paso.oficina,
          completado: paso.completado,
        })),
      });
      document.userReceivedDocument = receivedUsers;
    }

    const nameOfTheOffice = await this.httpService
      .get(`${this.apiOrganizationChartId}/${selectedPaso.idOffice}`)
      .toPromise();
    const nameOffce = nameOfTheOffice.data.name;

    const bitacoraEntry = document.bitacoraWorkflow.find((entry) => {
      return entry.receivedUsers.some((user) => user.idOfUser === userId);
    });
    const updateBitacoraEntry = {
      ...bitacoraEntry,
      receivedUsers: bitacoraEntry.receivedUsers.map((user) => {
        if (user.idOfUser === userId) {
          user.stateDocumentUser = 'OBSERVADO Y DEVUELTO';
        }
        return user;
      }),
    };
    const updateBitacoraWorkflow = document.bitacoraWorkflow.map((entry) => {
      return entry === bitacoraEntry ? updateBitacoraEntry : entry;
    });
    document.bitacoraWorkflow = updateBitacoraWorkflow;

    document.workflow = workflow;
    document.stateDocumentUserSend = `OBSERVADO PARA EL PASO: ${document.workflow.pasoActual}`;
    // document.stateDocumetUser = 'OBSERVADO Y DEVUELTO';

    const findEstadoUbicacion = await this.estadoUbicacionModel
      .findOne({ idDocument: documentId })
      .exec();

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${document.oficinaActual}`,
      stateOffice: 'OBSERVADO Y DEVUELTO',
      numberPasoOffice: pasoActual + 1,
      receivedUsers: document.userReceivedDocument,
      activo: false,
    });

    findEstadoUbicacion.estado_ubi.push({
      nameOffices: `${nameOffce}`,
      stateOffice: 'OBSERVADO',
      numberPasoOffice: numberPaso,
      receivedUsers: document.userReceivedDocument,
      activo: true,
    });

    await findEstadoUbicacion.save();
    document.estado_Ubicacion = findEstadoUbicacion;

    await document.save();
    return document;
  }

  private async validarDerivacion(document: Documents, userId: string) {
    if (document.workflow === null) {
      throw new HttpException(
        'No puedes derivar un documento que no ha comenzado un flujo de trabajo',
        400,
      );
    }
    const usuarioEnBitacora = document.bitacoraWorkflow.find((entry) =>
      entry.receivedUsers.some((user) => user.idOfUser === userId),
    );
    if (!usuarioEnBitacora) {
      throw new HttpException(
        'No tienes permisos para derivar el documento porque no lo recibiste',
        403,
      );
    }
  }
}
