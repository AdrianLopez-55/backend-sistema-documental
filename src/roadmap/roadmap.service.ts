import { Injectable, HttpException } from '@nestjs/common';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Roadmap, RoadmapDocuments } from './schemas/roadmap.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { CreateAssignedDocumentDto } from './dto/createAssignedDocument.dto';
import { AssignedDocument } from './schemas/assignedDocuments.schema';

@Injectable()
export class RoadmapService {
  private readonly apiDocument = getConfig().api_document;

  constructor(
    @InjectModel(Roadmap.name) private roadmapModel: Model<RoadmapDocuments>,
    @InjectModel(AssignedDocument.name)
    private assignedDocumentModel: Model<AssignedDocument>,
    private readonly httpService: HttpService,
  ) {}
  async create(createRoadmapDto: CreateRoadmapDto, tokenDat: string) {
    const {
      title,
      description,
      risks,
      additionalNotes,
      currentStatus,
      funtionalities,
      objetives,
      startDate,
      updateDate,
    } = createRoadmapDto;
    const existingRoadMap = await this.roadmapModel
      .findOne({ title: createRoadmapDto.title })
      .exec();
    if (existingRoadMap) {
      throw new HttpException('El nombre del roadmap ya existe', 400);
    }
    const newRoadMap = new this.roadmapModel({
      title: title,
      description: description,
      risks: risks,
      additionalNotes: additionalNotes,
      currentStatus: currentStatus,
      functionalities: funtionalities,
      objectives: objetives,
      startDate: startDate,
      updateDate: updateDate,
    });
    await newRoadMap.save();
    return newRoadMap;
  }

  async findAll() {
    return this.roadmapModel.find();
  }

  findOne(id: string) {
    return this.roadmapModel.findById(id);
  }

  async update(
    id: string,
    updateRoadmapDto: UpdateRoadmapDto,
  ): Promise<Roadmap> {
    return this.roadmapModel.findOneAndUpdate({ _id: id }, updateRoadmapDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.roadmapModel.findByIdAndRemove({ _id: id }).exec();
  }

  async addAssignedDocument(
    id: string,
    createAssignedDocument: CreateAssignedDocumentDto,
    tokenDat: string,
  ) {
    const roadmap = await this.roadmapModel.findById(id);
    const { numberDocument, ciUserDestination } = createAssignedDocument;
    try {
      const documentData = await this.httpService
        .get(`${this.apiDocument}?numberDocument=${numberDocument}`, {
          headers: {
            Authorization: `Bearer ${tokenDat}`,
          },
        })
        .toPromise();
      const exacMatch = documentData.data.find(
        (dat) => dat.numberDocument === numberDocument,
      );
      console.log(exacMatch._id);
      const userData = await this.httpService
        .get(`${getConfig().api_personal_get_ci}/${ciUserDestination}`, {
          headers: {
            Authorization: `Bearer ${tokenDat}`,
          },
        })
        .toPromise();
      const newAssignedDocument = new this.assignedDocumentModel({
        documentId: exacMatch._id,
        numberDocument,
        destinationUserId: userData.data._id,
        ciUserDestination,
      });
      roadmap.assignedDocumets.push(newAssignedDocument);
      roadmap.save();
      return roadmap;
    } catch (error) {}
  }
}
